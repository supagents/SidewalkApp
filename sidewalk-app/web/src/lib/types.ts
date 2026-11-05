export type HouseStatus = "support" | "undecided" | "against" | "not_home";

// The four fields that get an append-only event logged against them when
// changed — see HouseEvent. Deliberately excludes number/floor/notes: those
// are data corrections, not canvassing-activity events (see updateHouse in
// canvass-data.ts).
export type HouseEventField = "status" | "visited" | "lawnSign" | "revisit";

// Assembled once per session (canvass-screen.tsx) from either the signed-in
// member (useAuth()) or the guest's localStorage session
// (getStoredGuestSession(), via the isGuest prop) and threaded into every
// canvassing-activity write. Guests have no server-readable profile doc
// (sidewalk-firestore.rules: /guests/{uid} is read/write: false, written
// only by the joinCanvassByCode Cloud Function), so `name` has to be
// carried in by the caller at write time rather than resolved later by uid.
export type Actor = {
  uid: string;
  name: string;
  type: "member" | "guest";
};

// One doc per meaningful change to a canvassing-activity field — written to
// .../houses/{houseId}/events/{eventId}, in the same batch as the House
// field write itself (see canvass-data.ts). Append-only: Firestore rules
// allow create only, never update/delete, even for a manager.
//
// campaignId/canvassId/streetId/houseId are carried as real fields, not
// just implied by the document's path — a future collection-group query
// across every events subcollection (e.g. "everything this volunteer
// logged today, campaign-wide") needs them queryable; nothing here builds
// that query yet, this just keeps the schema from blocking it later.
export type HouseEvent = {
  id: string;
  campaignId: string;
  canvassId: string;
  streetId: string;
  houseId: string;
  field: HouseEventField;
  // Same representation as on House itself (HouseStatus|null for "status",
  // boolean for the other three) — stored loosely as unknown on the wire
  // rather than widening this type per-field.
  oldValue: unknown;
  newValue: unknown;
  actorUid: string;
  actorName: string;
  actorType: "member" | "guest";
  createdAt: number;
};

export type House = {
  id: string;
  streetId: string;
  number: string;
  floor: string;
  status: HouseStatus | null;
  lawnSign: boolean;
  revisit: boolean;
  // Checked off in GOTV mode (see gotv-checklist.tsx) — deliberately separate
  // from `status`: GOTV day-of is about confirming you reached a known
  // supporter, not re-assessing their support, so it doesn't touch or get
  // touched by the support/undecided/against/not-home taxonomy at all.
  visited: boolean;
  notes: string;
  // Denormalized from the most recent logged event (see canvass-data.ts)
  // so a house row can show "Last updated by X · 2h ago" with zero extra
  // reads. Both null until the first status/visited/lawnSign/revisit change
  // ever logged on this house — never backfilled for houses that predate
  // this feature.
  lastTouchedBy: string | null;
  lastTouchedAt: number | null;
  createdAt: number;
  address: string;
  lat: number | null;
  lng: number | null;
};

export type UserProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  organization: string;
  role: string;
  createdAt: number;
};

export type Campaign = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
};

export type StreetType = "street" | "condo";

export type Street = {
  id: string;
  name: string;
  type: StreetType;
  // Only set when type is "condo" — the building's own street address
  // (e.g. "123 Yonge Street"), combined with the canvass's city/state at
  // geocode time the same way a regular street's name is. A condo has one
  // physical location shared by every unit inside it, unlike a street
  // where each house number is its own address.
  address?: string;
  position: number;
  houseCount: number;
  revisitCount: number;
  lawnSignCount: number;
};

// "gotv" unlocks the ROUTE tab in CanvassScreen — a whole-canvass, proximity-
// ordered walk list (see lib/route.ts). Everything else about a canvass
// (adding streets/houses, importing, the map) works identically regardless
// of mode; this is purely a feature gate chosen at creation time, not a
// restriction.
export type CanvassMode = "standard" | "gotv";

export type Canvass = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  mode: CanvassMode;
  streetCount: number;
  doorCount: number;
  revisitCount: number;
  lawnSignCount: number;
  shareable: boolean;
  shareCode: string | null;
  city: string;
  state: string;
};

export type CanvassExport = {
  name: string;
  streets: { name: string; houses: House[] }[];
};
