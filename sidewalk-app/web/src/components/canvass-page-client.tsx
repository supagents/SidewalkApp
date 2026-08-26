"use client";

import { useRouter } from "next/navigation";
import { CanvassScreen } from "@/components/canvass-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuthGate } from "@/lib/use-auth-gate";

export function CanvassPageClient({ campaignId, canvassId }: { campaignId: string; canvassId: string }) {
  const gate = useAuthGate();
  const router = useRouter();

  if (gate.status !== "ready") return <LoadingScreen />;

  return (
    <CanvassScreen
      campaignId={campaignId}
      canvassId={canvassId}
      onBack={() => router.push(`/campaigns/${campaignId}`)}
    />
  );
}
