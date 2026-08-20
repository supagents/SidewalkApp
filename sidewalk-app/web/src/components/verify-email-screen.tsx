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
        window.location.reload();
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
