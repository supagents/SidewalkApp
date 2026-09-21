// Minimal point-in-polygon test (ray casting) against GeoJSON geometry —
// used to figure out which boundary (ward, riding, poll division, etc.)
// a geocoded house falls inside, once one's been uploaded as a map
// overlay. No new dependency: this is a well-known, compact algorithm,
// and the only geometry types a real boundary file ever actually uses
// are Polygon and MultiPolygon.

import type { Geometry } from "geojson";

type Ring = [number, number][]; // [lng, lat] pairs
type PolygonCoords = Ring[]; // first ring is the exterior, the rest are holes
type MultiPolygonCoords = PolygonCoords[];

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, coords: PolygonCoords): boolean {
  if (coords.length === 0 || !pointInRing(lng, lat, coords[0])) return false;
  // Inside the exterior ring, but also inside a hole (an interior ring) — not actually inside the shape.
  for (let i = 1; i < coords.length; i++) {
    if (pointInRing(lng, lat, coords[i])) return false;
  }
  return true;
}

export function pointInGeometry(lng: number, lat: number, geometry: Geometry): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygon(lng, lat, geometry.coordinates as unknown as PolygonCoords);
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as unknown as MultiPolygonCoords).some((poly) => pointInPolygon(lng, lat, poly));
  }
  return false;
}
