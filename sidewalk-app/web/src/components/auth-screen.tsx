"use client";

import { useState } from "react";
import { ChunkyBox } from "@/components/chunky-box";
import { Logo } from "@/components/logo";
import { Toast } from "@/components/toast";
import { authErrorMessage, logIn, signUp } from "@/lib/auth";

const inputClass =
  "w-full bg-white border-2 border-black rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 mb-5";
const labelClass = "block text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
  };

  const submit = async () => {
    if (!email.trim() || !password) return;
    if (mode === "signup" && password !== confirmPassword) {
      flashError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
      } else {
        await logIn(email.trim(), password);
      }
    } catch (err) {
      flashError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 flex-1">
      <div className="w-full max-w-sm">
        <div className="mb-1">
          <Logo />
        </div>
        <div className="text-sm text-gray-500 mb-9 ml-5">Doorknocking, simplified.</div>

        <label className={labelClass}>Email</label>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="jamie@example.com"
          className={inputClass}
        />

        <label className={labelClass}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
          className={mode === "signup" ? inputClass.replace("mb-5", "mb-4") : inputClass}
        />

        {mode === "signup" && (
          <>
            <label className={labelClass}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className={inputClass}
            />
          </>
        )}

        <ChunkyBox rounded="rounded-xl">
          <button
            onClick={submit}
            disabled={
              busy ||
              !email.trim() ||
              !password ||
              (mode === "signup" && !confirmPassword)
            }
            className="w-full py-3.5 font-bold tracking-wide rounded-xl disabled:opacity-30"
          >
            {busy ? "..." : mode === "signup" ? "SIGN UP" : "LOG IN"}
          </button>
        </ChunkyBox>

        <button
          onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
          className="w-full text-center text-sm font-semibold text-gray-500 mt-4 underline underline-offset-2"
        >
          {mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>

        {mode === "signup" && (
          <div className="text-xs text-gray-400 mt-6 leading-relaxed">
            We&apos;ll send a verification link to your email — you&apos;ll need to confirm it before
            you can start canvassing.
          </div>
        )}
      </div>
      <Toast message={error} />
    </div>
  );
}
