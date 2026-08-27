"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Flag, X } from "lucide-react";
import { FaceIcon, LawnSignIcon, NotHomeIcon } from "@/components/status-icons";
import type { House, HouseStatus } from "@/lib/types";

export function HouseRow({
  house,
  expanded,
  onToggleExpand,
  onStatusChange,
  onLawnSignToggle,
  onRevisitToggle,
  onNumberChange,
  onNotesChange,
  onDelete,
  canDelete = true,
}: {
  house: House;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: HouseStatus | null) => void;
  onLawnSignToggle: () => void;
  onRevisitToggle: () => void;
  onNumberChange: (number: string) => void;
  onNotesChange: (notes: string) => void;
  onDelete: () => void;
  canDelete?: boolean;
}) {
  const [editingNumber, setEditingNumber] = useState(false);
  const [numberDraft, setNumberDraft] = useState(house.number);
  const [noteDraft, setNoteDraft] = useState(house.notes);

  const commitNumber = () => {
    setEditingNumber(false);
    const trimmed = numberDraft.trim();
    if (trimmed) onNumberChange(trimmed);
    else setNumberDraft(house.number);
  };

  return (
    <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-2.5">
        {editingNumber ? (
          <input
            autoFocus
            value={numberDraft}
            onChange={(e) => setNumberDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitNumber();
              if (e.key === "Escape") {
                setNumberDraft(house.number);
                setEditingNumber(false);
              }
            }}
            onBlur={commitNumber}
            inputMode="numeric"
            className="w-9 h-9 flex-shrink-0 bg-gray-100 rounded-lg text-center font-extrabold text-sm outline-none border-2 border-black"
          />
        ) : (
          <button
            onClick={() => {
              setNumberDraft(house.number);
              setEditingNumber(true);
            }}
            className="w-9 h-9 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center font-extrabold text-sm"
          >
            {house.number}
          </button>
        )}

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => onStatusChange(house.status === "support" ? null : "support")}>
            <FaceIcon type="support" active={house.status === "support"} size={20} />
          </button>
          <button onClick={() => onStatusChange(house.status === "undecided" ? null : "undecided")}>
            <FaceIcon type="undecided" active={house.status === "undecided"} size={20} />
          </button>
          <button onClick={() => onStatusChange(house.status === "against" ? null : "against")}>
            <FaceIcon type="against" active={house.status === "against"} size={20} />
          </button>
          <button onClick={() => onStatusChange(house.status === "not_home" ? null : "not_home")} title="Not home">
            <NotHomeIcon active={house.status === "not_home"} size={20} />
          </button>
        </div>

        <button onClick={onLawnSignToggle} title="Lawn sign" className="flex-shrink-0 p-0.5">
          <LawnSignIcon active={house.lawnSign} size={17} />
        </button>

        <button
          onClick={onRevisitToggle}
          title="Flag for follow-up"
          className={"flex-shrink-0 p-0.5 " + (house.revisit ? "text-black" : "text-gray-300")}
        >
          <Flag size={16} strokeWidth={2.5} fill={house.revisit ? "#000" : "none"} />
        </button>

        <button onClick={onToggleExpand} className="ml-auto flex-shrink-0 p-0.5 text-gray-400">
          {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>

        {canDelete && (
          <button onClick={onDelete} className="flex-shrink-0 p-0.5 text-gray-300">
            <X size={15} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0.5 border-t border-gray-100">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => onNotesChange(noteDraft)}
            placeholder="Notes — dog on porch, call back after 6pm, etc."
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-black resize-none mt-2"
          />
        </div>
      )}
    </div>
  );
}
