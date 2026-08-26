"use client";

import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/home-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuthGate } from "@/lib/use-auth-gate";

export function CampaignHomePageClient({ campaignId }: { campaignId: string }) {
  const gate = useAuthGate();
  const router = useRouter();

  if (gate.status !== "ready") return <LoadingScreen />;

  return (
    <HomeScreen
      campaignId={campaignId}
      onOpenCanvass={(id) => router.push(`/campaigns/${campaignId}/canvasses/${id}`)}
      onBackToCampaigns={() => router.push("/campaigns")}
    />
  );
}
