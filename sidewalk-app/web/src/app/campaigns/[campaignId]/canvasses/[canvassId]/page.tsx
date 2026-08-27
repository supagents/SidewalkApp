import { connection } from "next/server";
import { CanvassPageClient } from "@/components/canvass-page-client";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ campaignId: string; canvassId: string }>;
}) {
  await connection();
  const { campaignId, canvassId } = await params;
  return <CanvassPageClient campaignId={campaignId} canvassId={canvassId} />;
}
