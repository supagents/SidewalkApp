"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { ChunkyBox } from "@/components/chunky-box";

export function LandingScreen({
  onSignUp,
  onLogIn,
  onJoin,
}: {
  onSignUp: () => void;
  onLogIn: () => void;
  onJoin: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 items-center px-6 py-14 overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col items-center text-center">
        <Logo />

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-8 leading-tight">
          Built to knock doors, not slow you down.
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mt-5 max-w-xl">
          Sidewalk is a fast, no-clutter platform for door-to-door campaigns. Plan your streets, log
          every door in real time, track lawn signs and follow-ups, and get volunteers canvassing with
          a single code. No spreadsheets. No bloat.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-sm sm:max-w-none sm:w-auto">
          <ChunkyBox rounded="rounded-xl">
            <button
              onClick={onSignUp}
              className="px-8 py-3.5 font-bold tracking-wide rounded-xl w-full sm:w-auto"
            >
              SIGN UP FREE
            </button>
          </ChunkyBox>
          <button
            onClick={onLogIn}
            className="px-8 py-3.5 font-bold tracking-wide rounded-xl border-2 border-black bg-white"
          >
            LOG IN
          </button>
        </div>

        <button onClick={onJoin} className="text-sm text-gray-400 underline underline-offset-2 mt-5">
          Have a canvass code? Join instead
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-400 mt-16">
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
        </div>

        <div className="text-[11px] text-gray-300 mt-3">Copyright © 2026 Sidewalk Strategy - All Rights Reserved</div>
      </div>
    </div>
  );
}
