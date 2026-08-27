import { connection } from "next/server";
import { HomeClient } from "@/components/home-client";

// Nonces (see proxy.ts) only get threaded into a page's scripts if the page
// is rendered per-request — a statically prerendered page is built once,
// before any request (and its CSP header/nonce) exists, so Next has nothing
// to inject the nonce into. connection() forces this page to wait for an
// actual incoming request, which opts it into dynamic rendering. Without
// this, every script on the page — including Next's own framework/hydration
// bundles — gets rejected outright by the nonce-based CSP.
export default async function Home() {
  await connection();
  return <HomeClient />;
}
