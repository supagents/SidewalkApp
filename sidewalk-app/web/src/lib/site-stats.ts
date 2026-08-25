import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GlobalStats } from "@/lib/types";

// stats/global is a single public-read document maintained entirely
// server-side by the computeGlobalStats Cloud Function (a scheduled
// recompute, not a per-write counter) — see sidewalk-functions/index.js.
// Nothing in the client ever writes to it; the Firestore rules enforce
// that (allow get, deny write), so this is safe to read even from the
// signed-out landing page.
export function subscribeGlobalStats(cb: (stats: GlobalStats | null) => void) {
  return onSnapshot(doc(db, "stats", "global"), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    const data = snap.data();
    cb({
      totalCampaigns: data.totalCampaigns ?? 0,
      totalAccounts: data.totalAccounts ?? 0,
      totalDoorsKnocked: data.totalDoorsKnocked ?? 0,
      totalLawnSigns: data.totalLawnSigns ?? 0,
      updatedAt: data.updatedAt?.toMillis?.() ?? 0,
    });
  });
}
