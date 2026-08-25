"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ChunkyBox } from "@/components/chunky-box";
import { subscribeGlobalStats } from "@/lib/site-stats";
import type { GlobalStats } from "@/lib/types";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K";
  return String(n);
}

function StatTile({ value, label, loading }: { value: number | null; label: string; loading: boolean }) {
  return (
    <div className="bg-white border-2 border-black rounded-xl px-4 py-5 text-center">
      <div className="text-3xl sm:text-4xl font-extrabold tabular-nums">
        {loading || value === null ? "—" : formatCount(value)}
      </div>
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mt-1">{label}</div>
    </div>
  );
}

export function LandingScreen({
  onSignUp,
  onLogIn,
  onJoin,
}: {
  onSignUp: () => void;
  onLogIn: () => void;
  onJoin: () => void;
}) {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => subscribeGlobalStats(setStats), []);

  return (
    <div className="flex flex-col flex-1 items-center px-6 py-14 overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col items-center text-center">
        <Logo />

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-8 leading-tight">
          Lean, modern canvassing —
          <br />
          built to knock doors, not slow you down.
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mt-5 max-w-xl">
          Sidewalk is a fast, no-clutter platform for door-to-door campaigns: plan streets, log every
          door in real time, track lawn signs and follow-ups, and hand volunteers a canvass with a
          single code — no spreadsheets, no bloat.
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

        <div className="w-full mt-16">
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">
            Powering campaigns right now
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile value={stats?.totalCampaigns ?? null} label="Campaigns" loading={!stats} />
            <StatTile value={stats?.totalAccounts ?? null} label="Candidates & organizers" loading={!stats} />
            <StatTile value={stats?.totalDoorsKnocked ?? null} label="Doors knocked" loading={!stats} />
            <StatTile value={stats?.totalLawnSigns ?? null} label="Lawn signs placed" loading={!stats} />
          </div>
        </div>
      </div>
    </div>
  );
}
