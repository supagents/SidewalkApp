// Shared between the live map (map-view.tsx) and the static map export
// (dot-map.ts / map-export-modal.tsx) so both draw houses with exactly the
// same colors/labels/keys — one definition, not two copies that could drift.
import { STATUS_COLORS, STATUS_LABEL, STATUS_ORDER } from "@/components/status-icons";
import type { House, HouseStatus } from "@/lib/types";

export const NO_STATUS_COLOR = "#D1D5DB"; // matches the pale gray "unlogged" face outline elsewhere in the app
export const LOGGED_COLOR = "#22C55E"; // same green as "support" elsewhere — reused as the one positive signal GOTV mode cares about
export const UNLOGGED = "unlogged";
export const LOGGED = "logged";

// GOTV canvasses aren't about re-assessing support (see House.visited) — a
// house is either checked off or it isn't — so this is a parallel, much
// smaller key space to the regular support/undecided/against/not-home one,
// not an extension of it.
export type FilterKey = HouseStatus | typeof UNLOGGED | typeof LOGGED;
export const FILTER_KEYS: FilterKey[] = [...STATUS_ORDER, UNLOGGED];
export const GOTV_FILTER_KEYS: FilterKey[] = [LOGGED, UNLOGGED];

export function filterColor(key: FilterKey, gotv: boolean) {
  if (gotv) return key === LOGGED ? LOGGED_COLOR : NO_STATUS_COLOR;
  return key === UNLOGGED ? NO_STATUS_COLOR : STATUS_COLORS[key as HouseStatus];
}
export function filterLabel(key: FilterKey, gotv: boolean) {
  if (gotv) return key === LOGGED ? "Logged" : "Unlogged";
  return key === UNLOGGED ? "Unlogged" : STATUS_LABEL[key as HouseStatus];
}
export function filterKeyForHouse(h: House, gotv: boolean): FilterKey {
  return gotv ? (h.visited ? LOGGED : UNLOGGED) : (h.status ?? UNLOGGED);
}
