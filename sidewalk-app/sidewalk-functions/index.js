// ============================================================
// SIDEWALK — Cloud Functions
// Deploy with: firebase deploy --only functions
// (requires `firebase init functions` in your project first)
// ============================================================

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// A plain !== comparison on a secret token returns as soon as it hits the
// first mismatched byte, so how long the comparison takes leaks (in
// principle) how many leading bytes of a guess were correct — a timing
// side channel. crypto.timingSafeEqual always takes the same time
// regardless of where the mismatch is. It requires equal-length buffers,
// so the length check has to happen first — but leaking whether two
// *lengths* differ isn't the same class of problem (both tokens here are
// fixed-length UUIDs in practice) as leaking *content* byte-by-byte.
function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

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
  if (!timingSafeStringEqual(invite.token, token)) {
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
// A 6-character code (32^6 ≈ 1.07B combinations) is impractical to brute
// force outright, but nothing was actually stopping repeated guesses
// either. This caps a given (anonymous) caller to a handful of attempts
// per window before failing closed — same "shared next-available-slot
// doc, updated in a transaction" shape as the geocode rate limiter below,
// just tracking a per-uid attempt count instead of a shared timestamp.
// Keyed on the caller's uid rather than IP: this function only runs for
// signed-in (including anonymous) callers, and Cloud Functions requests
// don't expose a client IP as directly usable as request.auth.uid.
// ------------------------------------------------------------
const JOIN_ATTEMPT_LIMIT = 8;
const JOIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

async function checkJoinRateLimit(uid) {
  const ref = db.doc(`joinAttempts/${uid}`);
  const blocked = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;

    if (!data || now - data.windowStart > JOIN_ATTEMPT_WINDOW_MS) {
      tx.set(ref, { windowStart: now, count: 1 });
      return false;
    }
    if (data.count >= JOIN_ATTEMPT_LIMIT) {
      return true;
    }
    tx.update(ref, { count: admin.firestore.FieldValue.increment(1) });
    return false;
  });
  if (blocked) {
    throw new HttpsError('resource-exhausted', 'Too many attempts. Try again in a few minutes.');
  }
}

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

  await checkJoinRateLimit(request.auth.uid);

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
// geocodeHouseOnWrite: fires on every create AND update of a house
// (single entry, bulk paste, CSV/TXT import, or an address backfilled
// onto a house that predates this field all end up here — a plain
// onCreate trigger would miss that last case entirely, since it only
// fires once, at the moment a doc is first created).
//
// Geocodes house.address via Nominatim (OpenStreetMap, no API key)
// and writes lat/lng back onto the house doc. The map view only ever
// reads these cached values — it never calls Nominatim itself. The
// guard below (only run when address is set but lat isn't yet) is
// what keeps this from re-geocoding on every unrelated edit — a
// status toggle or a notes change updates the doc too, but leaves lat
// already set, so it's a no-op here.
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

exports.geocodeHouseOnWrite = onDocumentWritten(
  {
    document: 'campaigns/{campaignId}/canvasses/{canvassId}/streets/{streetId}/houses/{houseId}',
    maxInstances: 10,
    timeoutSeconds: 300,
  },
  async (event) => {
    const after = event.data.after;
    if (!after.exists) return; // deleted, nothing to geocode

    const house = after.data();
    if (!house.address || house.lat != null) return; // nothing to do, or already geocoded

    try {
      await waitForGeocodeSlot();
      const coords = await geocode(house.address);
      if (coords) {
        await after.ref.update({ lat: coords.lat, lng: coords.lng });
      }
    } catch (err) {
      // Leave lat/lng unset — the house stays saved without a map pin
      // until this is retried (e.g. re-saving its address).
      console.error(`Geocoding failed for house ${after.ref.path}:`, err.message);
    }
  }
);
