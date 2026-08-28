import {
  collection,
  deleteDoc,
  doc,
  type DocumentReference,
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
import type { Canvass, CanvassExport, House, HouseStatus, Street, StreetType } from "@/lib/types";
import type { ParsedImport } from "@/lib/voter-import";

// Firestore caps a batch at 500 writes; this leaves headroom for a canvass
// with enough streets/houses to approach that.
const BATCH_CHUNK_SIZE = 450;

async function deleteRefsInChunks(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += BATCH_CHUNK_SIZE) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_CHUNK_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

type WriteOp = { ref: DocumentReference; data: object; merge?: boolean };

async function setRefsInChunks(ops: WriteOp[]) {
  for (let i = 0; i < ops.length; i += BATCH_CHUNK_SIZE) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_CHUNK_SIZE).forEach((op) => {
      if (op.merge) batch.set(op.ref, op.data, { merge: true });
      else batch.set(op.ref, op.data);
    });
    await batch.commit();
  }
}

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
          revisitCount: data.revisitCount ?? 0,
          lawnSignCount: data.lawnSignCount ?? 0,
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
    revisitCount: 0,
    lawnSignCount: 0,
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

// A house's address (see buildHouseAddress) is built once at creation
// time from its street name plus whatever city/state the canvass had
// right then — it doesn't dynamically track this field afterward.
// Without rebuilding every existing house's address and clearing its
// lat/lng here, correcting a wrong or missing city leaves each
// already-added house pinned wherever its stale address happened to
// geocode to: geocodeHouseOnWrite's guard (only geocode when lat isn't
// already set) permanently skips a house once it has *any* coordinates,
// right or wrong, and there'd otherwise be no way to make it try again.
export async function updateCanvassLocation(campaignId: string, canvassId: string, city: string, state: string) {
  await updateDoc(canvassRef(campaignId, canvassId), { city, state, updatedAt: serverTimestamp() });

  const streetsSnap = await getDocs(streetsCol(campaignId, canvassId));
  const houseOps: WriteOp[] = [];
  for (const streetDoc of streetsSnap.docs) {
    const streetData = streetDoc.data();
    const street = { type: (streetData.type as StreetType) ?? "street", name: streetData.name as string, address: streetData.address as string | undefined };
    const housesSnap = await getDocs(housesCol(campaignId, canvassId, streetDoc.id));
    housesSnap.docs.forEach((houseDoc) => {
      const number = houseDoc.data().number as string;
      houseOps.push({
        ref: houseDoc.ref,
        data: { address: houseAddressFor(street, number, city, state), lat: null, lng: null },
        merge: true,
      });
    });
  }
  await setRefsInChunks(houseOps);
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
          type: (data.type as StreetType) ?? "street",
          address: data.address ?? undefined,
          position: data.position ?? 0,
          houseCount: data.houseCount ?? 0,
          revisitCount: data.revisitCount ?? 0,
          lawnSignCount: data.lawnSignCount ?? 0,
        };
      })
    );
  });
}

export async function addStreet(
  campaignId: string,
  canvassId: string,
  name: string,
  type: StreetType = "street",
  address?: string
) {
  const id = newId(streetsCol(campaignId, canvassId));
  const batch = writeBatch(db);
  batch.set(streetRef(campaignId, canvassId, id), {
    name,
    type,
    ...(type === "condo" ? { address: address ?? "" } : {}),
    position: Date.now(),
    houseCount: 0,
    revisitCount: 0,
    lawnSignCount: 0,
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
  const revisitCount = housesSnap.docs.filter((d) => d.data().revisit).length;
  const lawnSignCount = housesSnap.docs.filter((d) => d.data().lawnSign).length;
  const batch = writeBatch(db);
  housesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(streetRef(campaignId, canvassId, streetId));
  batch.update(canvassRef(campaignId, canvassId), {
    streetCount: increment(-1),
    doorCount: increment(-housesSnap.size),
    revisitCount: increment(-revisitCount),
    lawnSignCount: increment(-lawnSignCount),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

// Deletes every street and house under a canvass, then the canvass itself.
// Unlike deleteStreet, a whole canvass can easily exceed one batch's 500-write
// cap, so this goes through deleteRefsInChunks rather than one writeBatch.
export async function deleteCanvass(campaignId: string, canvassId: string) {
  const streetsSnap = await getDocs(streetsCol(campaignId, canvassId));
  const houseRefs: DocumentReference[] = [];
  for (const streetDoc of streetsSnap.docs) {
    const housesSnap = await getDocs(housesCol(campaignId, canvassId, streetDoc.id));
    housesSnap.docs.forEach((d) => houseRefs.push(d.ref));
  }
  await deleteRefsInChunks(houseRefs);
  await deleteRefsInChunks(streetsSnap.docs.map((d) => d.ref));
  await deleteDoc(canvassRef(campaignId, canvassId));
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
          streetId,
          number: data.number,
          floor: data.floor ?? "",
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

// Every unit in a condo shares one physical building, unlike a street
// where each house number is its own address — so a unit's geocode
// target is the condo's own street address (never the unit number),
// combined with the canvass's city/state the same way a regular
// street's name is.
export function buildCondoUnitAddress(condoAddress: string, city: string, state: string): string {
  return [condoAddress, city, state].filter(Boolean).join(", ");
}

function houseAddressFor(street: Pick<Street, "type" | "name" | "address">, number: string, city: string, state: string): string {
  return street.type === "condo"
    ? buildCondoUnitAddress(street.address ?? "", city, state)
    : buildHouseAddress(number, street.name, city, state);
}

// Accepts one number or many, comma/whitespace-separated (or one per
// line, e.g. from a pasted spreadsheet column) — for a condo, these are
// unit numbers rather than house numbers, entered the same way; floor is
// filled in afterward per-unit (see HouseRow), same as notes. Skips
// numbers already logged on this street. Returns how many were actually
// added.
//
// Each house's address is built here from parts already known to the
// app (see houseAddressFor) instead of asking the volunteer to type a
// full address — lat/lng start unset and get filled in asynchronously by
// the geocodeHouseOnWrite Cloud Function.
export async function addHouses(
  campaignId: string,
  canvassId: string,
  street: Street,
  raw: string,
  existingNumbers: Set<string>,
  city: string,
  state: string
): Promise<number> {
  const streetId = street.id;
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
      floor: "",
      status: null,
      lawnSign: false,
      revisit: false,
      notes: "",
      createdAt: serverTimestamp(),
      address: houseAddressFor(street, number, city, state),
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

export type VoterImportResult = { housesAdded: number; housesSkipped: number; streetsCreated: number };

// Canvass-wide counterpart to addHouses: takes a ParsedImport (already
// grouped by street name and sorted by house number — see
// lib/voter-import.ts) and writes it across however many streets it
// spans, creating any street that doesn't already exist on this canvass
// (matched case-insensitively) rather than requiring one to be selected
// first. Each group's own city/state (from its CSV rows) wins over the
// canvass's when building a house's address; falls back to the canvass's
// when a row didn't have one.
export async function importVoterList(
  campaignId: string,
  canvassId: string,
  parsed: ParsedImport,
  existingStreets: Street[],
  fallbackCity: string,
  fallbackState: string
): Promise<VoterImportResult> {
  const existingByName = new Map(existingStreets.map((s) => [s.name.trim().toLowerCase(), s]));
  const houseOps: WriteOp[] = [];
  const streetOps: WriteOp[] = [];
  let housesAdded = 0;
  let housesSkipped = 0;
  let streetsCreated = 0;

  for (let i = 0; i < parsed.streets.length; i++) {
    const group = parsed.streets[i];
    const existing = existingByName.get(group.name.trim().toLowerCase());
    const streetId = existing ? existing.id : newId(streetsCol(campaignId, canvassId));

    let existingNumbers = new Set<string>();
    if (existing) {
      const housesSnap = await getDocs(housesCol(campaignId, canvassId, streetId));
      existingNumbers = new Set(housesSnap.docs.map((d) => d.data().number as string));
    }

    const seenInFile = new Set<string>();
    let addedForStreet = 0;
    group.houses.forEach((h) => {
      if (existingNumbers.has(h.number) || seenInFile.has(h.number)) {
        housesSkipped++;
        return;
      }
      seenInFile.add(h.number);
      addedForStreet++;
      houseOps.push({
        ref: doc(housesCol(campaignId, canvassId, streetId)),
        data: {
          number: h.number,
          floor: "",
          status: null,
          lawnSign: false,
          revisit: false,
          notes: h.notes,
          createdAt: serverTimestamp(),
          address: buildHouseAddress(h.number, group.name, h.city || fallbackCity, h.state || fallbackState),
          lat: null,
          lng: null,
        },
      });
    });

    if (addedForStreet === 0) continue; // nothing landed here — an all-duplicates group shouldn't create an empty street

    housesAdded += addedForStreet;
    if (existing) {
      streetOps.push({ ref: streetRef(campaignId, canvassId, streetId), data: { houseCount: increment(addedForStreet) }, merge: true });
    } else {
      streetsCreated++;
      streetOps.push({
        ref: streetRef(campaignId, canvassId, streetId),
        data: { name: group.name, position: Date.now() + i, houseCount: increment(addedForStreet) },
      });
    }
  }

  if (housesAdded === 0) return { housesAdded: 0, housesSkipped, streetsCreated: 0 };

  await setRefsInChunks(streetOps);
  await setRefsInChunks(houseOps);
  await updateDoc(canvassRef(campaignId, canvassId), {
    streetCount: increment(streetsCreated),
    doorCount: increment(housesAdded),
    updatedAt: serverTimestamp(),
  });

  return { housesAdded, housesSkipped, streetsCreated };
}

export async function updateHouse(
  campaignId: string,
  canvassId: string,
  streetId: string,
  houseId: string,
  patch: Partial<{ number: string; floor: string; status: HouseStatus | null; notes: string }>
) {
  await updateDoc(houseRef(campaignId, canvassId, streetId, houseId), patch);
  await updateDoc(canvassRef(campaignId, canvassId), { updatedAt: serverTimestamp() });
}

// Split out from updateHouse because toggling this one field also has to
// keep the street's and canvass's revisitCount counters (used for the
// follow-up badges in StreetNav/CanvassScreen/HomeScreen) in sync — a
// plain patch has no way to know the previous value to compute the delta.
export async function toggleHouseRevisit(
  campaignId: string,
  canvassId: string,
  streetId: string,
  houseId: string,
  revisit: boolean
) {
  const batch = writeBatch(db);
  batch.update(houseRef(campaignId, canvassId, streetId, houseId), { revisit });
  batch.update(streetRef(campaignId, canvassId, streetId), { revisitCount: increment(revisit ? 1 : -1) });
  batch.update(canvassRef(campaignId, canvassId), {
    revisitCount: increment(revisit ? 1 : -1),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

// Same shape as toggleHouseRevisit, for lawnSignCount.
export async function toggleHouseLawnSign(
  campaignId: string,
  canvassId: string,
  streetId: string,
  houseId: string,
  lawnSign: boolean
) {
  const batch = writeBatch(db);
  batch.update(houseRef(campaignId, canvassId, streetId, houseId), { lawnSign });
  batch.update(streetRef(campaignId, canvassId, streetId), { lawnSignCount: increment(lawnSign ? 1 : -1) });
  batch.update(canvassRef(campaignId, canvassId), {
    lawnSignCount: increment(lawnSign ? 1 : -1),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function deleteHouse(
  campaignId: string,
  canvassId: string,
  streetId: string,
  houseId: string,
  wasRevisit: boolean = false,
  wasLawnSign: boolean = false
) {
  const batch = writeBatch(db);
  batch.delete(houseRef(campaignId, canvassId, streetId, houseId));
  batch.update(streetRef(campaignId, canvassId, streetId), {
    houseCount: increment(-1),
    ...(wasRevisit ? { revisitCount: increment(-1) } : {}),
    ...(wasLawnSign ? { lawnSignCount: increment(-1) } : {}),
  });
  batch.update(canvassRef(campaignId, canvassId), {
    doorCount: increment(-1),
    ...(wasRevisit ? { revisitCount: increment(-1) } : {}),
    ...(wasLawnSign ? { lawnSignCount: increment(-1) } : {}),
    updatedAt: serverTimestamp(),
  });
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
          streetId: streetDoc.id,
          number: data.number,
          floor: data.floor ?? "",
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
      revisitCount: data.revisitCount ?? 0,
      lawnSignCount: data.lawnSignCount ?? 0,
      shareable: !!data.shareable,
      shareCode: data.shareCode ?? null,
      city: data.city ?? "",
      state: data.state ?? "",
    });
  });
}
