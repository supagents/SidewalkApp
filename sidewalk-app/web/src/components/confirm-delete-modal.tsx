"use client";

import { useState } from "react";

export type ConfirmDeleteTarget = { type: "street" | "house" | "canvass" | "campaign"; id: string; label: string };

const REQUIRES_PASSWORD: Record<ConfirmDeleteTarget["type"], boolean> = {
  street: false,
  house: false,
  canvass: true,
  campaign: true,
};

const NOUN: Record<ConfirmDeleteTarget["type"], string> = {
  street: "street",
  house: "house",
  canvass: "canvass",
  campaign: "campaign",
};

export function ConfirmDeleteModal({
  target,
  onCancel,
  onConfirm,
}: {
  target: ConfirmDeleteTarget;
  onCancel: () => void;
  // Throw to report failure (wrong password, or the delete itself failing) —
  // the modal shows the error inline and stays open so the user can retry.
  // Only resolving closes it (the caller is responsible for clearing
  // whatever state renders this modal once this promise resolves).
  onConfirm: (password?: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const needsPassword = REQUIRES_PASSWORD[target.type];

  const handleConfirm = async () => {
    if (submitting || (needsPassword && !password)) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(needsPassword ? password : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  };

  return (
    // z-[2000]: Leaflet's own panes/controls use z-index up to ~1000,
    // so a plain z-50 here rendered fully behind the map whenever the
    // Map tab was open — the dialog was "there" but invisible/unclickable.
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-[2000]">
      <div className="bg-white border-2 border-black rounded-2xl p-5 w-full max-w-xs">
        <div className="font-bold text-base mb-1.5">Delete this {NOUN[target.type]}?</div>
        <div className="text-sm text-gray-500 mb-4 leading-relaxed">
          {target.type === "campaign" && (
            <>
              This removes <span className="font-semibold text-black">{target.label}</span> and every canvass,
              street, and house in it. This can&apos;t be undone.
            </>
          )}
          {target.type === "canvass" && (
            <>
              This removes <span className="font-semibold text-black">{target.label}</span> and every street and
              house in it. This can&apos;t be undone.
            </>
          )}
          {target.type === "street" && (
            <>
              This removes <span className="font-semibold text-black">{target.label}</span> and every house
              logged on it. This can&apos;t be undone.
            </>
          )}
          {target.type === "house" && (
            <>
              This removes <span className="font-semibold text-black">{target.label}</span> and any notes on
              it. This can&apos;t be undone.
            </>
          )}
        </div>
        {needsPassword && (
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            placeholder="Confirm your account password"
            className="w-full border-2 border-black rounded-lg px-3 py-2.5 text-sm outline-none mb-2.5"
          />
        )}
        {error && <div className="text-xs text-red-600 mb-2.5 leading-relaxed">{error}</div>}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 border-2 border-black rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || (needsPassword && !password)}
            className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
          >
            {submitting ? "DELETING…" : "DELETE"}
          </button>
        </div>
      </div>
    </div>
  );
}
