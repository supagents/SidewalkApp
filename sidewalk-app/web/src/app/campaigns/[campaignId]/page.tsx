import { connection } from "next/server";
import { CampaignHomePageClient } from "@/components/campaign-home-page-client";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ campaignId: string }> }) {
  await connection();
  const { campaignId } = await params;
  return <CampaignHomePageClient campaignId={campaignId} />;
}
