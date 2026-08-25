export type HouseStatus = "support" | "undecided" | "against" | "not_home";

export type House = {
  id: string;
  number: string;
  status: HouseStatus | null;
  lawnSign: boolean;
  revisit: boolean;
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

export type Street = {
  id: string;
  name: string;
  position: number;
  houseCount: number;
  revisitCount: number;
  lawnSignCount: number;
};

export type Canvass = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
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

export type GlobalStats = {
  totalCampaigns: number;
  totalAccounts: number;
  totalDoorsKnocked: number;
  totalLawnSigns: number;
  updatedAt: number;
};
