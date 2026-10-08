// Builds a GOTV walk list: every geocoded house in a canvass, ordered by
// proximity starting from wherever the canvasser says they're starting.
// "Optimal" (true traveling-salesman) ordering is NP-hard and overkill at
// this scale; a greedy nearest-neighbor chain — always step to whichever
// remaining house is closest to wherever you just were — is the standard,
// fast, good-enough approach real turf-cutting tools use.

const EARTH_RADIUS_METERS = 6_371_000;

export type LatLng = { lat: number; lng: number };

// Great-circle distance between two points, in meters.
export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type RouteStop<T> = {
  item: T;
  // Distance in meters from the previous stop (or from the chosen start,
  // for the first stop) — what makes this visibly a "proximity" ordering
  // rather than an arbitrary one, and worth showing in the checklist UI.
  distanceFromPreviousMeters: number;
};

// O(n²) — repeatedly scans every not-yet-placed point for the closest one
// to wherever the chain currently is. Fine at canvass scale (low thousands
// of houses at most); a canvass large enough for this to matter would
// already be unworkable as a single in-app walk list regardless of how
// it's ordered.
export function nearestNeighborRoute<T>(start: LatLng, points: Array<{ item: T; at: LatLng }>): RouteStop<T>[] {
  const remaining = points.slice();
  const stops: RouteStop<T>[] = [];
  let current = start;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = haversineMeters(current, remaining[0].at);
    for (let i = 1; i < remaining.length; i++) {
      const d = haversineMeters(current, remaining[i].at);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    const [next] = remaining.splice(bestIndex, 1);
    stops.push({ item: next.item, distanceFromPreviousMeters: bestDistance });
    current = next.at;
  }

  return stops;
}
