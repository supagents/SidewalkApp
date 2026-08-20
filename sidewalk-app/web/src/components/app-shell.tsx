"use client";

import { useEffect, useState } from "react";
import { ensurePersonalCampaign } from "@/lib/campaign";
import { useAuth } from "@/lib/auth-context";
import { HomeScreen } from "@/components/home-screen";
import { CanvassScreen } from "@/components/canvass-screen";

export function AppShell() {
  const { user } = useAuth();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeCanvassId, setActiveCanvassId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    ensurePersonalCampaign(user.uid)
      .then((id) => {
        if (!cancelled) setCampaignId(id);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't set up your campaign. Try refreshing.");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  if (!campaignId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm tracking-[0.2em] text-gray-400 font-semibold">LOADING</div>
      </div>
    );
  }

  if (activeCanvassId) {
    return (
      <CanvassScreen campaignId={campaignId} canvassId={activeCanvassId} onBack={() => setActiveCanvassId(null)} />
    );
  }

  return <HomeScreen campaignId={campaignId} onOpenCanvass={setActiveCanvassId} />;
}
