// Turns every uploaded map overlay (see lib/map-overlays.ts) into one flat
// list of selectable "wards" — really any polygon boundary someone
// uploaded (ward, riding, poll division, etc.), not specifically an
// electoral ward. Kept separate from map-overlays.ts because this is
// about USING boundary data (matching houses to it), not storing it.

import type { Geometry } from "geojson";
import { pointInGeometry } from "@/lib/geo";
import type { MapOverlay } from "@/lib/map-overlays";

export type WardOption = { key: string; label: string; geometry: Geometry };

// Real-world boundary files for different municipalities don't spatially
// overlap — a house in Vaughan can't also fall inside a St. Catharines
// ward polygon — so flattening every uploaded file into one list and
// matching a house against all of them at once is safe in practice.
// When more than one overlay is loaded, each option is prefixed with its
// file's own name so e.g. two different files that both happen to have
// a "Ward 3" don't read as the same option; with only one overlay, the
// prefix would just be noise, so it's dropped.
export function buildWardOptions(overlays: MapOverlay[]): WardOption[] {
  const disambiguate = overlays.length > 1;
  const options: WardOption[] = [];
  overlays.forEach((o) => {
    o.geojson.features.forEach((f, i) => {
      if (!f.geometry || (f.geometry.type !== "Polygon" && f.geometry.type !== "MultiPolygon")) return;
      const rawLabel = (f.properties?.label as string | null | undefined) || `Shape ${i + 1}`;
      options.push({
        key: `${o.id}:${i}`,
        label: disambiguate ? `${o.name} — ${rawLabel}` : rawLabel,
        geometry: f.geometry,
      });
    });
  });
  return options;
}

export function findWardOption(options: WardOption[], key: string | null): WardOption | null {
  if (!key) return null;
  return options.find((o) => o.key === key) ?? null;
}

// First match wins if two loaded boundaries ever genuinely overlap
// (malformed data, or someone deliberately uploads overlapping layers)
// — not something to special-case further given real ward/riding/poll
// files don't do this.
export function wardKeyForPoint(lng: number, lat: number, options: WardOption[]): string | null {
  const match = options.find((o) => pointInGeometry(lng, lat, o.geometry));
  return match ? match.key : null;
}
