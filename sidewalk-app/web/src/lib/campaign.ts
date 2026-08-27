import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteCanvass } from "@/lib/canvass-data";
import type { Campaign } from "@/lib/types";

// The Firestore schema (sidewalk-firestore.rules) requires every canvass to
// live under a campaign, with access gated by campaigns/{id}/members/{uid}.
// That membership doc is only ever written by the onCampaignCreated Cloud
// Function (rules block direct client writes to it), so right after we
// create a campaign there's a short window before we're actually a member.
// campaignIds on the user's profile doc is what lets the client list "my
// campaigns" without a collection-group query (member docs don't carry a
// queryable uid field).

const MEMBERSHIP_POLL_INTERVAL_MS = 400;
const MEMBERSHIP_POLL_TIMEOUT_MS = 15000;

function profileRef(uid: string) {
  return doc(db, "profiles", uid);
}

async function waitForMembership(campaignId: string, uid: string) {
  const memberRef = doc(db, "campaigns", campaignId, "members", uid);
  const deadline = Date.now() + MEMBERSHIP_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const snap = await getDoc(memberRef);
      if (snap.exists()) return;
    } catch {
      // The rule that gates reading this doc requires it to already
      // exist (isMember checks the same path), so before the Cloud
      // Function creates it, Firestore denies the read outright rather
      // than returning a clean "not found" — that's expected here, not
      // a real failure, so keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, MEMBERSHIP_POLL_INTERVAL_MS));
  }
  throw new Error("Timed out setting up your campaign. Try refreshing.");
}

// Every account used to get exactly one auto-created "personal campaign",
// remembered as profiles/{uid}.personalCampaignId. Now an account can have
// several, tracked as profiles/{uid}.campaignIds — this folds a pre-existing
// personalCampaignId into that array (once) so nobody loses access to a
// campaign they already had.
async function getOwnedCampaignIds(uid: string): Promise<string[]> {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) return [];
  const data = snap.data();
  if (Array.isArray(data.campaignIds)) return data.campaignIds as string[];
  if (data.personalCampaignId) {
    const ids = [data.personalCampaignId as string];
    await updateDoc(profileRef(uid), { campaignIds: ids }).catch(() => {});
    return ids;
  }
  return [];
}

export function subscribeCampaigns(uid: string, cb: (campaigns: Campaign[]) => void) {
  let unsubscribeQuery: (() => void) | null = null;
  let cancelled = false;

  getOwnedCampaignIds(uid).then((ids) => {
    if (cancelled) return;
    if (ids.length === 0) {
      cb([]);
      return;
    }
    const q = query(collection(db, "campaigns"), where(documentId(), "in", ids));
    unsubscribeQuery = onSnapshot(q, (snap) => {
      const campaigns = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        };
      });
      campaigns.sort((a, b) => b.createdAt - a.createdAt);
      cb(campaigns);
    });
  });

  return () => {
    cancelled = true;
    unsubscribeQuery?.();
  };
}

export function subscribeCampaign(campaignId: string, cb: (campaign: Campaign | null) => void) {
  return onSnapshot(doc(db, "campaigns", campaignId), (snap) => {
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
    });
  });
}

export async function createCampaign(uid: string, name: string): Promise<string> {
  const campaignRef = doc(collection(db, "campaigns"));
  await setDoc(campaignRef, { name, createdBy: uid, createdAt: serverTimestamp() });
  await waitForMembership(campaignRef.id, uid);
  await setDoc(profileRef(uid), { campaignIds: arrayUnion(campaignRef.id) }, { merge: true });
  return campaignRef.id;
}

export async function renameCampaign(campaignId: string, name: string) {
  await updateDoc(doc(db, "campaigns", campaignId), { name });
}

// Deletes every canvass (and everything under it) in the campaign, then the
// campaign doc and the caller's own membership doc, and drops the campaign
// from their profile's campaignIds. The canvasses can be deleted in
// parallel — each touches a disjoint set of documents.
export async function deleteCampaign(uid: string, campaignId: string) {
  const canvassesSnap = await getDocs(collection(doc(db, "campaigns", campaignId), "canvasses"));
  await Promise.all(canvassesSnap.docs.map((d) => deleteCanvass(campaignId, d.id)));

  const batch = writeBatch(db);
  batch.delete(doc(db, "campaigns", campaignId, "members", uid));
  batch.delete(doc(db, "campaigns", campaignId));
  await batch.commit();

  await updateDoc(profileRef(uid), { campaignIds: arrayRemove(campaignId) }).catch(() => {});
}
