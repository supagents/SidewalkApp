"use client";

import { useEffect, useState } from "react";
import { CanvassScreen } from "@/components/canvass-screen";
import { AuthScreen } from "@/components/auth-screen";
import { clearGuestSession, getStoredGuestSession } from "@/lib/share";
import { logOut } from "@/lib/auth";

export function GuestCanvassScreen() {
  const [session] = useState(() => getStoredGuestSession());

  // An anonymous session with no stored join info (e.g. the join call
  // never completed, or storage was cleared) has nothing to show —
  // send them back to sign in for real or try joining again.
  useEffect(() => {
    if (!session) {
      clearGuestSession();
      logOut();
    }
  }, [session]);

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <CanvassScreen
      campaignId={session.campaignId}
      canvassId={session.canvassId}
      onBack={() => {}}
      isGuest
    />
  );
}
