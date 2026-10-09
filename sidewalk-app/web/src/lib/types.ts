export type HouseStatus = "support" | "undecided" | "against" | "not_home";

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
