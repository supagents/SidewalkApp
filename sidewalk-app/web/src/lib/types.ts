export type HouseStatus = "support" | "undecided" | "against" | "not_home";

export type House = {
  id: string;
  number: string;
  status: HouseStatus | null;
  lawnSign: boolean;
  revisit: boolean;
  notes: string;
  createdAt: number;
};

export type Street = {
  id: string;
  name: string;
  position: number;
  houseCount: number;
};

export type Canvass = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  streetCount: number;
  doorCount: number;
};

export type CanvassExport = {
  name: string;
  streets: { name: string; houses: House[] }[];
};
