"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { HouseRow } from "@/components/house-row";
import type { House, HouseStatus, Street } from "@/lib/types";

export function HouseList({
  street,
  houses,
  expandedHouseId,
  onToggleExpand,
  onStatusChange,
  onLawnSignToggle,
  onRevisitToggle,
  onNumberChange,
  onNotesChange,
  onDelete,
  canDelete = true,
}: {
  street: Street | null;
  houses: House[];
  expandedHouseId: string | null;
  onToggleExpand: (houseId: string) => void;
  onStatusChange: (houseId: string, status: HouseStatus | null) => void;
  onLawnSignToggle: (houseId: string) => void;
  onRevisitToggle: (houseId: string) => void;
  onNumberChange: (houseId: string, number: string) => void;
  onNotesChange: (houseId: string, notes: string) => void;
  onDelete: (houseId: string) => void;
  canDelete?: boolean;
}) {
  const [showRevisitsOnly, setShowRevisitsOnly] = useState(false);

  if (!street) {
    return (
      <div className="text-sm text-gray-400 text-center mt-10 px-6 leading-relaxed">
        Add a street to start logging houses.
      </div>
    );
  }
  if (houses.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center mt-10 px-6 leading-relaxed">
        No houses on {street.name} yet.
        <br />
        Add a house number below.
      </div>
    );
  }

  const revisitCount = houses.filter((h) => h.revisit).length;
  const visible = showRevisitsOnly ? houses.filter((h) => h.revisit) : houses;

  return (
    <>
      {revisitCount > 0 && (
        <button
          onClick={() => setShowRevisitsOnly((v) => !v)}
          className={
            "flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full border-2 border-black mb-2.5 " +
            (showRevisitsOnly ? "bg-black text-white" : "bg-white")
          }
        >
          <Flag size={13} strokeWidth={2.5} />
          {showRevisitsOnly ? "SHOWING FOLLOW-UPS ONLY" : "FILTER TO FOLLOW-UPS"}
          <span className={showRevisitsOnly ? "text-gray-300" : "text-gray-400"}>({revisitCount})</span>
        </button>
      )}
      {visible.length === 0 && <div className="text-sm text-gray-400 text-center mt-8">No follow-ups flagged here.</div>}
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:items-start">
        {visible.map((h) => (
          <HouseRow
            key={h.id}
            house={h}
            expanded={expandedHouseId === h.id}
            onToggleExpand={() => onToggleExpand(h.id)}
            onStatusChange={(status) => onStatusChange(h.id, status)}
            onLawnSignToggle={() => onLawnSignToggle(h.id)}
            onRevisitToggle={() => onRevisitToggle(h.id)}
            onNumberChange={(number) => onNumberChange(h.id, number)}
            onNotesChange={(notes) => onNotesChange(h.id, notes)}
            onDelete={() => onDelete(h.id)}
            canDelete={canDelete}
          />
        ))}
      </div>
    </>
  );
}
