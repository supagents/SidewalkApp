"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";

// Every page under /campaigns is a real, refresh-safe route (see the
// per-route page.tsx files) rather than component state, so each one
// needs to independently re-check auth on load — a direct visit or a
// refresh lands here before AuthProvider's onIdTokenChanged has
// necessarily resolved. Anonymous/unverified users belong at "/"
// (GuestCanvassScreen / VerifyEmailScreen live there), not here.
export function useAuthGate(): { status: "loading" } | { status: "ready"; user: User } {
  const { user, loading } = useAuth();
  const router = useRouter();
  const blocked = !loading && (!user || user.isAnonymous || !user.emailVerified);

  useEffect(() => {
    if (blocked) router.replace("/");
  }, [blocked, router]);

  if (loading || blocked || !user) return { status: "loading" };
  return { status: "ready", user };
}
