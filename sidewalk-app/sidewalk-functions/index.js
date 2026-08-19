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
