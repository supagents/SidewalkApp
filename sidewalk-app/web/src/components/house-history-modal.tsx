"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchHouseEvents } from "@/lib/canvass-data";
import { formatRelativeTime } from "@/lib/time";
import type { HouseEvent, HouseEventField } from "@/lib/types";

const FIELD_LABEL: Record<HouseEventField, string> = {
  status: "Status",
  visited: "Visited",
  lawnSign: "Lawn sign",
  revisit: "Follow-up flag",
};

function formatValue(field: HouseEventField, value: unknown): string {
  if (field === "status") return value == null ? "none" : String(value);
  return value ? "yes" : "no";
}

export function HouseHistoryModal({
  campaignId,
  canvassId,
  streetId,
  houseId,
  houseLabel,
  onClose,
}: {
  campaignId: string;
  canvassId: string;
  streetId: string;
  houseId: string;
  houseLabel: string;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<HouseEvent[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchHouseEvents(campaignId, canvassId, streetId, houseId)
      .then((list) => !cancelled && setEvents(list))
      .catch(() => !cancelled && setError("Couldn't load history. Try again."));
    return () => {
      cancelled = true;
    };
  }, [campaignId, canvassId, streetId, houseId]);

  return (
    // z-[2000]: same reasoning as ConfirmDeleteModal — Leaflet's own
    // panes/controls use z-index up to ~1000, so this needs to clear that
    // whenever it's opened from the Map or Route tab.
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-[2000]">
      <div className="bg-white border-2 border-black rounded-2xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-base truncate">History — {houseLabel}</div>
          <button onClick={onClose} className="p-1 text-gray-400 flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {error ? (
            <div className="text-xs text-red-600 text-center py-6">{error}</div>
          ) : events === null ? (
            <div className="text-sm text-gray-400 text-center py-6">Loading…</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-6">No changes logged yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((e) => (
                <div key={e.id} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <div className="font-semibold">
                    {FIELD_LABEL[e.field]}: {formatValue(e.field, e.oldValue)} → {formatValue(e.field, e.newValue)}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {e.actorName} · {formatRelativeTime(e.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
