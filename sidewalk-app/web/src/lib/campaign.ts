import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// The Firestore schema (sidewalk-firestore.rules) requires every canvass to
// live under a campaign, with access gated by campaigns/{id}/members/{uid}.
// That membership doc is only ever written by the onCampaignCreated Cloud
// Function (rules block direct client writes to it), so right after we
// create a campaign there's a short window before we're actually a member.
// This gives every signed-in user their own single personal campaign,
// remembered on their profile doc, and waits out that window once.

const MEMBERSHIP_POLL_INTERVAL_MS = 400;
const MEMBERSHIP_POLL_TIMEOUT_MS = 15000;

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

export async function ensurePersonalCampaign(uid: string): Promise<string> {
  const profileRef = doc(db, "profiles", uid);
  const profileSnap = await getDoc(profileRef);
  const existingId = profileSnap.exists() ? (profileSnap.data().personalCampaignId as string | undefined) : undefined;

  if (existingId) {
    await waitForMembership(existingId, uid);
    return existingId;
  }

  const campaignRef = doc(db, "campaigns", crypto.randomUUID());
  await setDoc(campaignRef, {
    name: "My Campaign",
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  await setDoc(profileRef, { personalCampaignId: campaignRef.id }, { merge: true });
  await waitForMembership(campaignRef.id, uid);
  return campaignRef.id;
}
