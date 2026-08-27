import { connection } from "next/server";
import { CampaignsPageClient } from "@/components/campaigns-page-client";

// Same reasoning as the root page: the nonce-based CSP (see proxy.ts) only
// reaches a page's scripts if it's rendered per-request, so every route
// needs to opt into dynamic rendering the same way.
export const dynamic = "force-dynamic";

export default async function Page() {
  await connection();
  return <CampaignsPageClient />;
}
