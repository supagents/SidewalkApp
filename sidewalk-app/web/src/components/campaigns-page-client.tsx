"use client";

import { useRouter } from "next/navigation";
import { CampaignScreen } from "@/components/campaign-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuthGate } from "@/lib/use-auth-gate";

export function CampaignsPageClient() {
  const gate = useAuthGate();
  const router = useRouter();

  if (gate.status !== "ready") return <LoadingScreen />;

  return <CampaignScreen onOpenCampaign={(id) => router.push(`/campaigns/${id}`)} />;
}
