"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { turnOffSharing, turnOnSharing } from "@/lib/share";
import type { Canvass } from "@/lib/types";

export function SharePanel({
  campaignId,
  canvass,
  createdBy,
  onError,
}: {
  campaignId: string;
  canvass: Canvass;
  createdBy: string;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      if (!canvass.shareable) {
        await turnOnSharing(campaignId, canvass.id, createdBy);
      } else if (canvass.shareCode) {
        await turnOffSharing(campaignId, canvass.id, canvass.shareCode);
      }
    } catch {
      onError("Couldn't update sharing.");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!canvass.shareCode) return;
    try {
      await navigator.clipboard.writeText(canvass.shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onError("Could not copy. Long-press to copy manually.");
    }
  };

  return (
    <div className="mx-4 mb-3 p-3.5 border-2 border-black rounded-xl bg-white">
      {!canvass.shareable ? (
        <>
          <div className="text-sm font-bold mb-1">Make this canvass shareable</div>
          <div className="text-xs text-gray-500 mb-3 leading-relaxed">
            Anyone with the code can join and log houses straight into this same canvass — no account
            needed.
          </div>
          <button
            onClick={toggle}
            disabled={busy}
            className="w-full bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
          >
            {busy ? "WORKING…" : "TURN ON SHARING"}
          </button>
        </>
      ) : (
        <>
          <div className="text-sm font-bold mb-1">Sharing is on</div>
          <div className="text-xs text-gray-500 mb-3 leading-relaxed">
            Give volunteers this code. Everything they log lands right here.
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border-2 border-black rounded-lg py-2.5 text-center font-extrabold text-lg tracking-[0.3em]">
              {canvass.shareCode}
            </div>
            <button
              onClick={copyCode}
              className="p-2.5 border-2 border-black rounded-lg bg-white flex-shrink-0"
              title="Copy code"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <button
            onClick={toggle}
            disabled={busy}
            className="w-full border-2 border-black rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
          >
            {busy ? "WORKING…" : "TURN OFF SHARING"}
          </button>
        </>
      )}
    </div>
  );
}
