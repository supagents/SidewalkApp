"use client";

import { useState } from "react";
import { ChunkyBox } from "@/components/chunky-box";
import { Logo } from "@/components/logo";
import { Toast } from "@/components/toast";
import { auth } from "@/lib/firebase";
import { authErrorMessage, logOut, resendVerificationEmail } from "@/lib/auth";

export function VerifyEmailScreen() {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const checkVerified = async () => {
    setChecking(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        // reload() refreshes the client-side user profile (emailVerified
        // flips true here), but the signed-in session's auth token — the
        // thing Firestore rules actually check via request.auth.token
        // .email_verified — keeps whatever claims it had when it was
        // issued until it's force-refreshed. getIdToken(true) mints a
        // fresh one carrying the correct claim, and because AuthProvider
        // listens via onIdTokenChanged, that alone updates this tab's
        // React auth state and lets home-client.tsx's existing redirect
        // take over — deliberately NOT a window.location.reload(): a
        // hard reload discards this whole JS context and restores
        // whatever's on disk, and if that disk write hadn't durably
        // landed yet, the reloaded page could come back with the very
        // same stale token this is trying to get rid of. Staying in this
        // tab means every subsequent request definitely uses the token
        // that's actually in memory here, not a guess about what's on disk.
        await auth.currentUser?.getIdToken(true);
      } else {
        flash("Still not verified — check your inbox (and spam folder).");
      }
    } catch (err) {
      flash(authErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      flash("Verification email sent.");
    } catch (err) {
      flash(authErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 flex-1">
      <div className="w-full max-w-sm text-center">
        <div className="mb-1 flex justify-center">
          <Logo />
        </div>
        <div className="text-sm text-gray-500 mb-9">Doorknocking, simplified.</div>

        <div className="text-lg font-bold mb-2">Verify your email</div>
        <div className="text-sm text-gray-500 mb-8 leading-relaxed">
          We sent a link to <span className="font-semibold text-black">{auth.currentUser?.email}</span>.
          Click it, then come back here.
        </div>

        <ChunkyBox rounded="rounded-xl">
          <button
            onClick={checkVerified}
            disabled={checking}
            className="w-full py-3.5 font-bold tracking-wide rounded-xl disabled:opacity-30"
          >
            {checking ? "..." : "I'VE VERIFIED"}
          </button>
        </ChunkyBox>

        <button
          onClick={resend}
          disabled={resending}
          className="w-full text-center text-sm font-semibold text-gray-500 mt-4 underline underline-offset-2 disabled:opacity-40"
        >
          {resending ? "Sending..." : "Resend email"}
        </button>

        <button
          onClick={() => logOut()}
          className="w-full text-center text-sm text-gray-400 mt-6"
        >
          Log out
        </button>
      </div>
      <Toast message={message} />
    </div>
  );
}
