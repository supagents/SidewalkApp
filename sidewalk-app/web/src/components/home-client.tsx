"use client";

import { AuthScreen } from "@/components/auth-screen";
import { AppShell } from "@/components/app-shell";
import { GuestCanvassScreen } from "@/components/guest-canvass-screen";
import { VerifyEmailScreen } from "@/components/verify-email-screen";
import { useAuth } from "@/lib/auth-context";

export function HomeClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm tracking-[0.2em] text-gray-400 font-semibold">LOADING</div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (user.isAnonymous) return <GuestCanvassScreen />;
  if (!user.emailVerified) return <VerifyEmailScreen />;
  return <AppShell />;
}
