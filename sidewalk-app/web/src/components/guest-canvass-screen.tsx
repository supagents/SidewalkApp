"use client";

import { useEffect, useState } from "react";
import { CanvassScreen } from "@/components/canvass-screen";
import { AuthScreen } from "@/components/auth-screen";
import { clearGuestSession, getStoredGuestSession, type GuestSession } from "@/lib/share";
import { logOut } from "@/lib/auth";

const SESSION_POLL_INTERVAL_MS = 150;
const SESSION_POLL_TIMEOUT_MS = 10000;

export function GuestCanvassScreen() {
  const [session, setSession] = useState<GuestSession | null>(() => getStoredGuestSession());
  // Tracks whether we've actually confirmed there's no session, as opposed
  // to just not having found it yet — see the polling effect below.
  const [checked, setChecked] = useState(!!session);

  // joinCanvassByCode (lib/share.ts) signs in anonymously, THEN calls the
  // join Cloud Function, THEN writes the session to localStorage — but
  // signing in anonymously is what flips page.tsx over to this component
  // (via onAuthStateChanged), which can easily happen well before that
  // Cloud Function round-trip finishes. A plain one-time localStorage read
  // on mount was landing in that gap: session missing yet, so this bailed
  // out to AuthScreen immediately — the join had actually gone through
  // seconds later, which is why only a manual refresh "fixed" it. Poll
  // briefly instead of judging on the first read, the same way
  // lib/campaign.ts's waitForMembership rides out its own propagation gap.
  useEffect(() => {
    if (session) return;
    let cancelled = false;
    const deadline = Date.now() + SESSION_POLL_TIMEOUT_MS;
    const poll = () => {
      if (cancelled) return;
      const found = getStoredGuestSession();
      if (found) {
        setSession(found);
        setChecked(true);
        return;
      }
      if (Date.now() >= deadline) {
        setChecked(true);
        return;
      }
      setTimeout(poll, SESSION_POLL_INTERVAL_MS);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Only once we've genuinely given up (not just "haven't checked yet")
  // does a missing session mean anything — the join never completed, or
  // storage was cleared. Send them back to sign in for real or try again.
  useEffect(() => {
    if (checked && !session) {
      clearGuestSession();
      logOut();
    }
  }, [checked, session]);

  if (!checked) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm tracking-[0.2em] text-gray-400 font-semibold">LOADING</div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-black text-white text-xs font-bold tracking-[0.2em] text-center py-1.5 flex-shrink-0">
        GUEST MODE · {session.displayName}
      </div>
      <CanvassScreen campaignId={session.campaignId} canvassId={session.canvassId} onBack={() => {}} isGuest />
    </div>
  );
}
