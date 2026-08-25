"use client";

import { useState } from "react";
import { AuthScreen } from "@/components/auth-screen";
import { AppShell } from "@/components/app-shell";
import { GuestCanvassScreen } from "@/components/guest-canvass-screen";
import { LandingScreen } from "@/components/landing-screen";
import { VerifyEmailScreen } from "@/components/verify-email-screen";
import { useAuth } from "@/lib/auth-context";

type AuthEntry = { mode: "login" | "signup"; screen: "auth" | "join" };

export function HomeClient() {
  const { user, loading } = useAuth();
  const [authEntry, setAuthEntry] = useState<AuthEntry | null>(null);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm tracking-[0.2em] text-gray-400 font-semibold">LOADING</div>
      </div>
    );
  }

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
  return <AppShell />;
}
