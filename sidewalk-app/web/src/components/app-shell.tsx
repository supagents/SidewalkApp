"use client";

import { useState } from "react";
import { CampaignScreen } from "@/components/campaign-screen";
import { HomeScreen } from "@/components/home-screen";
import { CanvassScreen } from "@/components/canvass-screen";

export function AppShell() {
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeCanvassId, setActiveCanvassId] = useState<string | null>(null);

  if (!activeCampaignId) {
    return <CampaignScreen onOpenCampaign={setActiveCampaignId} />;
  }

  if (activeCanvassId) {
    return (
      <CanvassScreen campaignId={activeCampaignId} canvassId={activeCanvassId} onBack={() => setActiveCanvassId(null)} />
    );
  }

  return (
    <HomeScreen
      campaignId={activeCampaignId}
      onOpenCanvass={setActiveCanvassId}
      onBackToCampaigns={() => setActiveCampaignId(null)}
    />
  );
}
