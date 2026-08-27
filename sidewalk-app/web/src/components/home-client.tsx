"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { GuestCanvassScreen } from "@/components/guest-canvass-screen";
import { LandingScreen } from "@/components/landing-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { VerifyEmailScreen } from "@/components/verify-email-screen";
import { useAuth } from "@/lib/auth-context";

type AuthEntry = { mode: "login" | "signup"; screen: "auth" | "join" };

export function HomeClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authEntry, setAuthEntry] = useState<AuthEntry | null>(null);
  const fullyAuthed = !loading && !!user && !user.isAnonymous && user.emailVerified;

  // Signed-in, verified members live under /campaigns (real routes, so
  // refreshing or sharing a link keeps you where you were) — "/" is only
  // the signed-out/loading/guest/unverified gateway.
  useEffect(() => {
    if (fullyAuthed) router.replace("/campaigns");
  }, [fullyAuthed, router]);

  if (loading) return <LoadingScreen />;

  if (!user) {
    if (!authEntry) {
      return (
        <LandingScreen
          onSignUp={() => setAuthEntry({ mode: "signup", screen: "auth" })}
          onLogIn={() => setAuthEntry({ mode: "login", screen: "auth" })}
          onJoin={() => setAuthEntry({ mode: "login", screen: "join" })}
        />
      );
    }
    return (
      <AuthScreen
        initialMode={authEntry.mode}
        initialScreen={authEntry.screen}
        onBack={() => setAuthEntry(null)}
      />
    );
  }

  if (user.isAnonymous) return <GuestCanvassScreen />;
  if (!user.emailVerified) return <VerifyEmailScreen />;
  return <LoadingScreen />;
}
