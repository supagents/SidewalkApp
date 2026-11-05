// Campaign-wide targeting intelligence: given every geocoded house (and
// every logged event) across a campaign, surface where to actually spend
// limited canvassing/GOTV hours — dense supporter pockets, areas where
// outreach is low-ROI, doors that still need a repeat knock, and who's
// been doing the work. Everything here is a derived view over data that
// already exists (House.status/visited/lastTouchedAt, HouseEvent) — no new
// Firestore writes, just read-time analysis.

import { haversineMeters, type LatLng } from "@/lib/route";
import type { House, HouseEvent, Street } from "@/lib/types";

export type HouseCluster = {
  center: LatLng;
  houses: House[];
};

// Roughly a short walkable block — close enough that two houses this far
// apart are realistically "the same stop" for a canvasser, far enough
// apart that a long block doesn't fracture into several tiny clusters.
// Callers needing a different grain (dense urban vs. rural) can override.
export const DEFAULT_CLUSTER_RADIUS_METERS = 180;

// Greedy "leader" clustering: each house joins the first existing cluster
// whose centroid is within radiusMeters, or starts a new one. Same
// tradeoff lib/route.ts's nearest-neighbor routing already makes at this
// scale — a fast, explainable heuristic, not a globally optimal
// clustering (true density clustering, e.g. DBSCAN, would need sorting
// out edge cases like chained-but-not-mutually-close points; not
// warranted at canvass/campaign scale). Deterministic given a stable
// input order; O(n * clusters), fine for the house counts this app deals
// with.
export function clusterHouses(houses: House[], radiusMeters: number = DEFAULT_CLUSTER_RADIUS_METERS): HouseCluster[] {
  const clusters: HouseCluster[] = [];
  for (const h of houses) {
    if (h.lat == null || h.lng == null) continue;
    const point: LatLng = { lat: h.lat, lng: h.lng };
    const existing = clusters.find((c) => haversineMeters(c.center, point) <= radiusMeters);
    if (existing) {
      existing.houses.push(h);
      // Recompute centroid as the running average of every member's
      // coordinates, so the cluster stays anchored near its actual
      // members instead of drifting toward whoever joined first.
      const n = existing.houses.length;
      existing.center = {
        lat: existing.center.lat + (point.lat - existing.center.lat) / n,
        lng: existing.center.lng + (point.lng - existing.center.lng) / n,
      };
    } else {
      clusters.push({ center: point, houses: [h] });
    }
  }
  return clusters;
}

export type TargetArea = {
  label: string;
  center: LatLng;
  count: number;
  // The denominator for this area's rate — meaning depends on which
  // function produced it (see each one's own comment): "every geocoded
  // door nearby" for supportClusters/avoidAreas, "every known supporter
  // nearby" for gotvPriorityAreas. Always >= count, since a cluster's own
  // members are themselves within its radius.
  total: number;
  houses: House[];
};

function clusterLabel(cluster: HouseCluster, streetById: Map<string, Street>): string {
  const names = Array.from(new Set(cluster.houses.map((h) => streetById.get(h.streetId)?.name).filter(Boolean)));
  if (names.length === 0) return "Unknown area";
  if (names.length === 1) return names[0] as string;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} & ${names.length - 1} more streets`;
}

// Every geocoded house within radiusMeters of `center` and matching
// `predicate` — the same radius clusterHouses used to form the cluster in
// the first place, so "total" and "count" are measuring the same
// neighborhood. O(houses) per area; fine at campaign scale (a handful of
// areas, each checked against at most a few thousand houses).
function countNearby(houses: House[], center: LatLng, radiusMeters: number, predicate: (h: House) => boolean): number {
  let n = 0;
  for (const h of houses) {
    if (h.lat == null || h.lng == null || !predicate(h)) continue;
    if (haversineMeters(center, { lat: h.lat, lng: h.lng }) <= radiusMeters) n++;
  }
  return n;
}

function toTargetAreas(
  clusters: HouseCluster[],
  streetById: Map<string, Street>,
  topN: number,
  totalFor: (center: LatLng) => number
): TargetArea[] {
  return clusters
    .slice()
    .sort((a, b) => b.houses.length - a.houses.length)
    .slice(0, topN)
    .map((c) => ({
      label: clusterLabel(c, streetById),
      center: c.center,
      count: c.houses.length,
      total: totalFor(c.center),
      houses: c.houses,
    }));
}

// The densest pockets of confirmed supporters — useful for lawn-sign
// routes, volunteer recruiting, or picking where to hold a visible event.
// `total` is every geocoded door nearby (any status, or none), so the rate
// reads as "how much of this area supports us."
export function supportClusters(
  houses: House[],
  streets: Street[],
  topN = 5,
  radiusMeters: number = DEFAULT_CLUSTER_RADIUS_METERS
): TargetArea[] {
  const streetById = new Map(streets.map((s) => [s.id, s]));
  const supporters = houses.filter((h) => h.status === "support");
  return toTargetAreas(clusterHouses(supporters, radiusMeters), streetById, topN, (center) =>
    countNearby(houses, center, radiusMeters, () => true)
  );
}

// The mirror case: dense pockets of recorded opposition. This is a
// resource-allocation signal, not anything about discouraging or
// suppressing a vote — the standard field-organizing practice of not
// spending your own limited volunteer-hours generating turnout for the
// other side. `total` is every geocoded door nearby, same as
// supportClusters, so the rate reads as "how much of this area opposes us."
export function avoidAreas(
  houses: House[],
  streets: Street[],
  topN = 5,
  radiusMeters: number = DEFAULT_CLUSTER_RADIUS_METERS
): TargetArea[] {
  const streetById = new Map(streets.map((s) => [s.id, s]));
  const opposition = houses.filter((h) => h.status === "against");
  return toTargetAreas(clusterHouses(opposition, radiusMeters), streetById, topN, (center) =>
    countNearby(houses, center, radiusMeters, () => true)
  );
}

// Confirmed supporters not yet checked off in a GOTV canvass (House.visited
// — see gotv-checklist.tsx), ranked by local density. The densest pockets
// of still-uncontacted supporters are where a GOTV hour goes furthest;
// see the per-canvass ROUTE tab for turn-by-turn routing once a team is
// actually headed to one of these areas. `total` here is every KNOWN
// supporter nearby (contacted or not), not every door — the rate reads as
// "how much GOTV work is left in this supporter pocket," which is a
// different question than supportClusters' "how supportive is this area."
export function gotvPriorityAreas(
  houses: House[],
  streets: Street[],
  topN = 5,
  radiusMeters: number = DEFAULT_CLUSTER_RADIUS_METERS
): TargetArea[] {
  const streetById = new Map(streets.map((s) => [s.id, s]));
  const uncontacted = houses.filter((h) => h.status === "support" && !h.visited);
  return toTargetAreas(clusterHouses(uncontacted, radiusMeters), streetById, topN, (center) =>
    countNearby(houses, center, radiusMeters, (h) => h.status === "support")
  );
}

export type RepeatDoor = {
  house: House;
  streetName: string;
  // null means this house has never had a canvassing-activity event
  // logged at all (added but never attempted) — distinct from a genuine
  // not-home contact attempt however long ago, so it's not conflated with
  // "very overdue."
  daysSinceTouch: number | null;
};

// Doors worth a second knock: never actually reached (not_home) or
// explicitly flagged for follow-up, ranked by how long it's been since
// the last logged change — the longer a not-home or flagged door goes
// untouched, the more "due" it is. Houses with no lastTouchedAt (added
// but never attempted) sort last — there's no real contact attempt to
// follow up on yet, so they're a lower priority than a door that was
// tried and missed.
export function doorsToRepeat(houses: House[], streets: Street[], limit = 20, now: number = Date.now()): RepeatDoor[] {
  const streetById = new Map(streets.map((s) => [s.id, s]));
  return houses
    .filter((h) => h.status === "not_home" || h.revisit)
    .map((h) => ({
      house: h,
      streetName: streetById.get(h.streetId)?.name ?? "",
      daysSinceTouch: h.lastTouchedAt != null ? Math.floor((now - h.lastTouchedAt) / 86_400_000) : null,
    }))
    .sort((a, b) => (b.daysSinceTouch ?? -1) - (a.daysSinceTouch ?? -1))
    .slice(0, limit);
}

export type DayCount = { date: string; count: number }; // date: "YYYY-MM-DD", local calendar day

// Doors worked per day, oldest to newest, over the trailing `days` days
// (including days with zero activity, so a trend chart doesn't silently
// skip them). Counts unique houses touched that day, not raw event
// count — a single visit can log more than one field (e.g. status and a
// lawn sign back to back), and counting events would overcount that one
// door twice.
export function doorsPerDay(events: HouseEvent[], days = 14, now: number = Date.now()): DayCount[] {
  const buckets = new Map<string, Set<string>>();
  const cutoff = now - days * 86_400_000;
  events.forEach((e) => {
    if (e.createdAt < cutoff) return;
    const date = new Date(e.createdAt).toISOString().slice(0, 10);
    const set = buckets.get(date) ?? new Set<string>();
    set.add(e.houseId);
    buckets.set(date, set);
  });
  const result: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    result.push({ date, count: buckets.get(date)?.size ?? 0 });
  }
  return result;
}

export type VolunteerStat = { actorName: string; doorCount: number };

// Doors logged per volunteer, keyed by uid (not name) so two canvassers
// who happen to share a display name are never merged into one line — the
// displayed name is whichever one they used most recently, in case it
// changed between events.
export function volunteerLeaderboard(events: HouseEvent[], limit = 10): VolunteerStat[] {
  const byActor = new Map<string, { name: string; houseIds: Set<string>; latestAt: number }>();
  events.forEach((e) => {
    const entry = byActor.get(e.actorUid) ?? { name: e.actorName, houseIds: new Set<string>(), latestAt: -Infinity };
    entry.houseIds.add(e.houseId);
    if (e.createdAt >= entry.latestAt) {
      entry.name = e.actorName;
      entry.latestAt = e.createdAt;
    }
    byActor.set(e.actorUid, entry);
  });
  return Array.from(byActor.values())
    .map((entry) => ({ actorName: entry.name, doorCount: entry.houseIds.size }))
    .sort((a, b) => b.doorCount - a.doorCount)
    .slice(0, limit);
}
