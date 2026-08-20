import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Canvass, CanvassExport, House, HouseStatus, Street } from "@/lib/types";

function campaignRef(campaignId: string) {
  return doc(db, "campaigns", campaignId);
}
function canvassesCol(campaignId: string) {
  return collection(campaignRef(campaignId), "canvasses");
}
function canvassRef(campaignId: string, canvassId: string) {
  return doc(canvassesCol(campaignId), canvassId);
}
function streetsCol(campaignId: string, canvassId: string) {
  return collection(canvassRef(campaignId, canvassId), "streets");
}
function streetRef(campaignId: string, canvassId: string, streetId: string) {
  return doc(streetsCol(campaignId, canvassId), streetId);
}
function housesCol(campaignId: string, canvassId: string, streetId: string) {
  return collection(streetRef(campaignId, canvassId, streetId), "houses");
}
function houseRef(campaignId: string, canvassId: string, streetId: string, houseId: string) {
  return doc(housesCol(campaignId, canvassId, streetId), houseId);
}

function newId(col: ReturnType<typeof collection>) {
  return doc(col).id;
}

// ---------- Canvasses ----------

export function subscribeCanvasses(campaignId: string, cb: (canvasses: Canvass[]) => void) {
  const q = query(canvassesCol(campaignId), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
          updatedAt: data.updatedAt?.toMillis?.() ?? 0,
          streetCount: data.streetCount ?? 0,
          doorCount: data.doorCount ?? 0,
          shareable: !!data.shareable,
          shareCode: data.shareCode ?? null,
          city: data.city ?? "",
          state: data.state ?? "",
        };
      })
    );
  });
}

export async function createCanvass(
  campaignId: string,
  name: string,
  createdBy: string,
  city: string,
  state: string
) {
  const id = newId(canvassesCol(campaignId));
  await setDoc(canvassRef(campaignId, id), {
    name,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    streetCount: 0,
    doorCount: 0,
    shareable: false,
    shareCode: null,
    city,
    state,
  });
  return id;
}

export async function renameCanvass(campaignId: string, canvassId: string, name: string) {
  await updateDoc(canvassRef(campaignId, canvassId), { name, updatedAt: serverTimestamp() });
}

export async function updateCanvassLocation(campaignId: string, canvassId: string, city: string, state: string) {
  await updateDoc(canvassRef(campaignId, canvassId), { city, state, updatedAt: serverTimestamp() });
}

// ---------- Streets ----------

export function subscribeStreets(campaignId: string, canvassId: string, cb: (streets: Street[]) => void) {
  const q = query(streetsCol(campaignId, canvassId), orderBy("position", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          position: data.position ?? 0,
          houseCount: data.houseCount ?? 0,
        };
      })
    );
  });
}

export async function addStreet(campaignId: string, canvassId: string, name: string) {
  const id = newId(streetsCol(campaignId, canvassId));
  const batch = writeBatch(db);
  batch.set(streetRef(campaignId, canvassId, id), {
    name,
    position: Date.now(),
    houseCount: 0,
  });
  batch.update(canvassRef(campaignId, canvassId), {
    streetCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return id;
}

export async function renameStreet(campaignId: string, canvassId: string, streetId: string, name: string) {
  await updateDoc(streetRef(campaignId, canvassId, streetId), { name });
}

export async function deleteStreet(campaignId: string, canvassId: string, streetId: string) {
  const housesSnap = await getDocs(housesCol(campaignId, canvassId, streetId));
  const batch = writeBatch(db);
  housesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(streetRef(campaignId, canvassId, streetId));
  batch.update(canvassRef(campaignId, canvassId), {
    streetCount: increment(-1),
    doorCount: increment(-housesSnap.size),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

// ---------- Houses ----------

export function subscribeHouses(
  campaignId: string,
  canvassId: string,
  streetId: string,
  cb: (houses: House[]) => void
) {
  const q = query(housesCol(campaignId, canvassId, streetId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          number: data.number,
          status: data.status ?? null,
          lawnSign: !!data.lawnSign,
          revisit: !!data.revisit,
          notes: data.notes ?? "",
          createdAt: data.createdAt?.toMillis?.() ?? 0,
          address: data.address ?? "",
          lat: data.lat ?? null,
          lng: data.lng ?? null,
        };
      })
    );
  });
}

export function buildHouseAddress(number: string, streetName: string, city: string, state: string): string {
  return [`${number} ${streetName}`, city, state].filter(Boolean).join(", ");
}

// Accepts one number or many, comma/whitespace-separated (or one per
// line, e.g. from a pasted spreadsheet column). Skips numbers already
// logged on this street. Returns how many were actually added.
//
// Each house's address is built here from parts already known to the
// app (street name + the canvass's city/state) instead of asking the
// volunteer to type a full address — lat/lng start unset and get
// filled in asynchronously by the geocodeHouseOnCreate Cloud Function.
export async function addHouses(
  campaignId: string,
  canvassId: string,
  streetId: string,
  raw: string,
  existingNumbers: Set<string>,
  streetName: string,
  city: string,
  state: string
): Promise<number> {
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return 0;

  const seen = new Set(existingNumbers);
  const toAdd: string[] = [];
  tokens.forEach((number) => {
    if (!seen.has(number)) {
      seen.add(number);
      toAdd.push(number);
    }
  });
  if (toAdd.length === 0) return 0;

  const batch = writeBatch(db);
  const col = housesCol(campaignId, canvassId, streetId);
  toAdd.forEach((number) => {
    batch.set(doc(col), {
      number,
      status: null,
      lawnSign: false,
      revisit: false,
      notes: "",
      createdAt: serverTimestamp(),
      address: buildHouseAddress(number, streetName, city, state),
      lat: null,
      lng: null,
    });
  });
  batch.update(streetRef(campaignId, canvassId, streetId), { houseCount: increment(toAdd.length) });
  batch.update(canvassRef(campaignId, canvassId), {
    doorCount: increment(toAdd.length),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return toAdd.length;
}

export async function updateHouse(
  campaignId: string,
  canvassId: string,
  streetId: string,
  houseId: string,
  patch: Partial<{ number: string; status: HouseStatus | null; lawnSign: boolean; revisit: boolean; notes: string }>
) {
  await updateDoc(houseRef(campaignId, canvassId, streetId, houseId), patch);
  await updateDoc(canvassRef(campaignId, canvassId), { updatedAt: serverTimestamp() });
}

export async function deleteHouse(campaignId: string, canvassId: string, streetId: string, houseId: string) {
  const batch = writeBatch(db);
  batch.delete(houseRef(campaignId, canvassId, streetId, houseId));
  batch.update(streetRef(campaignId, canvassId, streetId), { houseCount: increment(-1) });
  batch.update(canvassRef(campaignId, canvassId), { doorCount: increment(-1), updatedAt: serverTimestamp() });
  await batch.commit();
}

// ---------- Export (reads full tree once, no live subscription) ----------

async function fetchCanvassExport(campaignId: string, canvassId: string, name: string): Promise<CanvassExport> {
  const streetsSnap = await getDocs(query(streetsCol(campaignId, canvassId), orderBy("position", "asc")));
  const streets = await Promise.all(
    streetsSnap.docs.map(async (streetDoc) => {
      const housesSnap = await getDocs(
        query(housesCol(campaignId, canvassId, streetDoc.id), orderBy("createdAt", "asc"))
      );
      const houses: House[] = housesSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          number: data.number,
          status: data.status ?? null,
          lawnSign: !!data.lawnSign,
          revisit: !!data.revisit,
          notes: data.notes ?? "",
          createdAt: data.createdAt?.toMillis?.() ?? 0,
          address: data.address ?? "",
          lat: data.lat ?? null,
          lng: data.lng ?? null,
        };
      });
      return { name: streetDoc.data().name as string, houses };
    })
  );
  return { name, streets };
}

export async function exportCanvass(campaignId: string, canvass: Canvass): Promise<CanvassExport> {
  return fetchCanvassExport(campaignId, canvass.id, canvass.name);
}

export async function exportAllCanvasses(campaignId: string, canvasses: Canvass[]): Promise<CanvassExport[]> {
  return Promise.all(canvasses.map((c) => fetchCanvassExport(campaignId, c.id, c.name)));
}

// For callers (map "All streets", results "whole canvass" scope) that
// only need the flattened houses, not an export shape — keyed on the
// stable canvassId rather than the Canvass object, whose reference
// changes on every canvass-doc write and would otherwise make a
// dependent effect re-run (and re-fetch the whole tree) on any
// unrelated edit while that view stays open.
export async function fetchCanvassHouses(campaignId: string, canvassId: string): Promise<House[]> {
  const data = await fetchCanvassExport(campaignId, canvassId, "");
  return data.streets.flatMap((s) => s.houses);
}

export function subscribeCanvass(campaignId: string, canvassId: string, cb: (canvass: Canvass | null) => void) {
  return onSnapshot(canvassRef(campaignId, canvassId), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const data = snap.data();
    cb({
      id: snap.id,
      name: data.name,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toMillis?.() ?? 0,
      updatedAt: data.updatedAt?.toMillis?.() ?? 0,
      streetCount: data.streetCount ?? 0,
      doorCount: data.doorCount ?? 0,
      shareable: !!data.shareable,
      shareCode: data.shareCode ?? null,
      city: data.city ?? "",
      state: data.state ?? "",
    });
  });
}
