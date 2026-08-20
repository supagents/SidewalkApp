// ============================================================
// SIDEWALK — Cloud Functions
// Deploy with: firebase deploy --only functions
// (requires `firebase init functions` in your project first)
// ============================================================

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ------------------------------------------------------------
// acceptInvite: call from the app after the user has signed in.
//   const acceptInvite = httpsCallable(functions, 'acceptInvite');
//   await acceptInvite({ campaignId, inviteId, token });
//
// Runs with Admin privileges, so it can write to /members even
// though clients are blocked from writing there directly.
// ------------------------------------------------------------
exports.acceptInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to accept an invite.');
  }

  const { campaignId, inviteId, token } = request.data;
  if (!campaignId || !inviteId || !token) {
    throw new HttpsError('invalid-argument', 'Missing campaignId, inviteId, or token.');
  }

  const inviteRef = db.doc(`campaigns/${campaignId}/invites/${inviteId}`);
  const inviteSnap = await inviteRef.get();

  if (!inviteSnap.exists) {
    throw new HttpsError('not-found', 'This invite could not be found.');
  }

  const invite = inviteSnap.data();

  if (invite.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'This invite has already been used or revoked.');
  }
  if (invite.token !== token) {
    throw new HttpsError('permission-denied', 'Invalid invite link.');
  }
  if (invite.expiresAt.toDate() < new Date()) {
    throw new HttpsError('failed-precondition', 'This invite has expired.');
  }
  const authEmail = (request.auth.token.email || '').toLowerCase();
  if (invite.email.toLowerCase() !== authEmail) {
    throw new HttpsError('permission-denied', 'This invite was sent to a different email address.');
  }

  const memberRef = db.doc(`campaigns/${campaignId}/members/${request.auth.uid}`);

  await db.runTransaction(async (tx) => {
    tx.set(memberRef, {
      role: invite.role,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.update(inviteRef, { status: 'accepted' });
  });

  return { campaignId, role: invite.role };
});

// ------------------------------------------------------------
// When a campaign is created, auto-add its creator as manager.
// (Client can create the /campaigns doc directly per the rules,
// but cannot write to /members directly — this closes that gap.)
// ------------------------------------------------------------
exports.onCampaignCreated = onDocumentCreated('campaigns/{campaignId}', async (event) => {
  const campaign = event.data.data();
  const campaignId = event.params.campaignId;

  await db.doc(`campaigns/${campaignId}/members/${campaign.createdBy}`).set({
    role: 'manager',
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// ------------------------------------------------------------
// joinCanvassByCode: call after signing in anonymously.
//   const joinCanvassByCode = httpsCallable(functions, 'joinCanvassByCode');
//   const { campaignId, canvassId, canvassName } =
//     (await joinCanvassByCode({ code, displayName })).data;
//
// Runs with Admin privileges to write campaigns/{id}/canvasses/{id}/
// guests/{uid}, which clients can never write directly. That doc is
// what the security rules check to grant the guest read/write access
// to this ONE canvass — not the rest of the campaign.
// ------------------------------------------------------------
exports.joinCanvassByCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to join a canvass.');
  }

  const code = (request.data.code || '').trim().toUpperCase();
  const displayName = (request.data.displayName || '').trim();
  if (!code || !displayName) {
    throw new HttpsError('invalid-argument', 'Missing code or display name.');
  }

  const codeRef = db.doc(`shareCodes/${code}`);
  const codeSnap = await codeRef.get();
  if (!codeSnap.exists) {
    throw new HttpsError('not-found', "That code doesn't match an active canvass.");
  }
  const { campaignId, canvassId } = codeSnap.data();

  const canvassRef = db.doc(`campaigns/${campaignId}/canvasses/${canvassId}`);
  const canvassSnap = await canvassRef.get();
  if (!canvassSnap.exists || !canvassSnap.data().shareable) {
    throw new HttpsError('failed-precondition', "That canvass isn't shared anymore.");
  }

  await canvassRef.collection('guests').doc(request.auth.uid).set({
    displayName,
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { campaignId, canvassId, canvassName: canvassSnap.data().name };
});

// ------------------------------------------------------------
// geocodeHouseOnCreate: fires whenever a house is added anywhere in
// the app (single entry, bulk paste, or CSV/TXT import all end up
// creating a house doc, so this catches every path with one trigger).
//
// Geocodes house.address via Nominatim (OpenStreetMap, no API key)
// and writes lat/lng back onto the house doc. The map view only ever
// reads these cached values — it never calls Nominatim itself.
//
// Nominatim's usage policy caps free public API use at ~1 request/
// second. Multiple houses can be created in the same instant (a bulk
// import, or several volunteers at once), and Cloud Functions may run
// several invocations of this trigger concurrently, so pacing can't
// just be an in-memory delay — a single Firestore transaction on a
// shared "next available slot" doc serializes the actual Nominatim
// calls to ~1/sec across ALL concurrent invocations, regardless of
// how many are running.
//
// A failed or unmatched address just leaves lat/lng unset — the house
// itself is already saved by the time this runs, so nothing here
// blocks house creation; it only ever adds a pin once geocoding
// succeeds.
// ------------------------------------------------------------
const NOMINATIM_MIN_INTERVAL_MS = 1100;
const GEOCODE_RATE_LIMITER_REF = () => db.doc('system/geocodeRateLimiter');

async function waitForGeocodeSlot() {
  const slotAt = await db.runTransaction(async (tx) => {
    const snap = await tx.get(GEOCODE_RATE_LIMITER_REF());
    const now = Date.now();
    const previousNext = snap.exists ? snap.data().nextAvailableAt : 0;
    const slot = Math.max(now, previousNext);
    tx.set(GEOCODE_RATE_LIMITER_REF(), { nextAvailableAt: slot + NOMINATIM_MIN_INTERVAL_MS }, { merge: true });
    return slot;
  });
  const delay = slotAt - Date.now();
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SidewalkCanvassApp/1.0 (doorknocking canvass tool)' },
  });
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;
  const { lat, lon } = results[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon) };
}

exports.geocodeHouseOnCreate = onDocumentCreated(
  {
    document: 'campaigns/{campaignId}/canvasses/{canvassId}/streets/{streetId}/houses/{houseId}',
    maxInstances: 10,
    timeoutSeconds: 300,
  },
  async (event) => {
    const house = event.data.data();
    if (!house.address) return;

    try {
      await waitForGeocodeSlot();
      const coords = await geocode(house.address);
      if (coords) {
        await event.data.ref.update({ lat: coords.lat, lng: coords.lng });
      }
    } catch (err) {
      // Leave lat/lng unset — the house stays saved without a map pin
      // until this is retried (a future re-geocode action, if added).
      console.error(`Geocoding failed for house ${event.data.ref.path}:`, err.message);
    }
  }
);
