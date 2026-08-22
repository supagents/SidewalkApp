// User-uploaded boundary layers (ward, riding, poll division, or any other
// district) for a canvass's map — GeoJSON, KML, or a zipped Shapefile, all
// normalized down to a lean GeoJSON FeatureCollection before it's stored.
//
// Deliberately NOT tied to any one country's electoral geography: a
// candidate anywhere uploads whatever boundary file their local
// jurisdiction publishes, in whatever of these three formats it comes in.

import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { kml as kmlToGeoJSON } from "@tmcw/togeojson";
import shp from "shpjs";
import type { FeatureCollection } from "geojson";
import { db } from "@/lib/firebase";

export type MapOverlay = {
  id: string;
  name: string;
  color: string;
  geojson: FeatureCollection;
  createdBy: string;
  createdAt: number;
};

// Firestore caps a document at ~1MiB; this leaves headroom for the other
// fields on the doc. Raw government exports routinely carry far more
// coordinate precision and attribute data than a district boundary needs,
// which is what normalizeGeoJSON below is for — but a large/complex
// boundary can still land over this, in which case we ask the uploader to
// simplify it externally rather than silently truncating their shape.
const MAX_GEOJSON_BYTES = 900_000;
const COORD_PRECISION = 6; // ~11cm at the equator — far finer than any district boundary needs

export const OVERLAY_COLORS = ["#2563EB", "#DC2626", "#16A34A", "#D97706", "#7C3AED", "#0891B2", "#DB2777", "#4B5563"];

function overlaysCol(campaignId: string, canvassId: string) {
  return collection(db, "campaigns", campaignId, "canvasses", canvassId, "mapOverlays");
}

export function subscribeMapOverlays(campaignId: string, canvassId: string, cb: (overlays: MapOverlay[]) => void) {
  const q = query(overlaysCol(campaignId, canvassId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          color: data.color,
          // Stored as a JSON string, not a native Firestore array/map — see
          // the comment on uploadMapOverlay's setDoc call below for why.
          geojson: JSON.parse(data.geojson) as FeatureCollection,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        };
      })
    );
  });
}

export async function deleteMapOverlay(campaignId: string, canvassId: string, overlayId: string) {
  await deleteDoc(doc(overlaysCol(campaignId, canvassId), overlayId));
}

function roundCoords(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (typeof value[0] === "number") {
      return value.map((n) => (typeof n === "number" ? Number(n.toFixed(COORD_PRECISION)) : n));
    }
    return value.map((v) => roundCoords(v));
  }
  return value;
}

const LABEL_PROPERTY_CANDIDATES = [
  "name",
  "NAME",
  "Name",
  "ward",
  "WARD",
  "Ward",
  "district",
  "DISTRICT",
  "District",
  "riding",
  "RIDING",
  "Riding",
  "poll",
  "POLL",
  "Poll",
  "label",
  "LABEL",
  "Label",
  "id",
  "ID",
];

function extractLabel(properties: Record<string, unknown> | null | undefined): string | undefined {
  if (!properties) return undefined;
  for (const key of LABEL_PROPERTY_CANDIDATES) {
    const v = properties[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

type RawFeature = {
  type?: string;
  properties?: Record<string, unknown> | null;
  geometry?: { type: string; coordinates: unknown };
};

const GEOMETRY_TYPES = ["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon", "GeometryCollection"];

function toFeatureArray(input: unknown): RawFeature[] {
  if (!input || typeof input !== "object") return [];
  const obj = input as { type?: string; features?: RawFeature[]; geometry?: unknown };
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) return obj.features;
  if (obj.type === "Feature") return [obj as RawFeature];
  if (obj.geometry) return [{ type: "Feature", geometry: obj.geometry as RawFeature["geometry"] }];
  if (obj.type && GEOMETRY_TYPES.includes(obj.type)) {
    return [{ type: "Feature", geometry: obj as unknown as RawFeature["geometry"] }];
  }
  return [];
}

// Strips a parsed boundary file down to just what the map needs: rounded
// coordinates, and per feature a best-guess label instead of a whole
// attribute table (a shapefile's DBF can carry dozens of columns nothing
// here uses, and shouldn't be stored just because they came along for the
// ride).
function normalizeGeoJSON(raw: unknown): FeatureCollection {
  const features = toFeatureArray(raw);
  return {
    type: "FeatureCollection",
    features: features
      .filter((f): f is RawFeature & { geometry: { type: string; coordinates: unknown } } => !!f.geometry)
      .map((f) => ({
        type: "Feature" as const,
        properties: { label: extractLabel(f.properties) ?? null },
        geometry: {
          type: f.geometry.type,
          coordinates: roundCoords(f.geometry.coordinates),
        },
      })),
  } as FeatureCollection;
}

async function parseFile(file: File): Promise<unknown> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) {
    const buffer = await file.arrayBuffer();
    return await shp(buffer);
  }
  const text = await file.text();
  if (name.endsWith(".kml")) {
    const dom = new DOMParser().parseFromString(text, "text/xml");
    return kmlToGeoJSON(dom);
  }
  // .geojson / .json, or anything else — assume GeoJSON text
  return JSON.parse(text);
}

export async function uploadMapOverlay(
  campaignId: string,
  canvassId: string,
  uid: string,
  name: string,
  file: File,
  colorIndex: number
): Promise<void> {
  let raw: unknown;
  try {
    raw = await parseFile(file);
  } catch {
    throw new Error("Couldn't read that file — check it's a valid GeoJSON, KML, or zipped Shapefile.");
  }

  // shpjs returns one FeatureCollection per layer in the zip if there are
  // several; flatten them all into one before normalizing.
  const merged = Array.isArray(raw)
    ? { type: "FeatureCollection", features: raw.flatMap((fc) => toFeatureArray(fc)) }
    : raw;
  const geojson = normalizeGeoJSON(merged);

  if (geojson.features.length === 0) {
    throw new Error("Couldn't find any shapes in that file.");
  }

  // A GeoJSON Polygon/MultiPolygon's coordinates are an array directly
  // containing other arrays (rings of [lng,lat] pairs, or arrays of
  // those for a MultiPolygon) — Firestore rejects that shape outright
  // ("Nested arrays are not supported") if stored as a native array/map
  // field. Storing it as a JSON string sidesteps the restriction entirely
  // (Firestore has no such limit on strings) without needing to move this
  // out of Firestore — subscribeMapOverlays parses it back on the way out.
  const geojsonText = JSON.stringify(geojson);
  const sizeBytes = new Blob([geojsonText]).size;
  if (sizeBytes > MAX_GEOJSON_BYTES) {
    throw new Error(
      `That boundary is too detailed to store (${Math.round(sizeBytes / 1024)}KB, limit ~${Math.round(
        MAX_GEOJSON_BYTES / 1024
      )}KB). Simplify it first — mapshaper.org is a free tool for this — then try again.`
    );
  }

  const ref = doc(overlaysCol(campaignId, canvassId));
  await setDoc(ref, {
    name,
    color: OVERLAY_COLORS[colorIndex % OVERLAY_COLORS.length],
    geojson: geojsonText,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
}
