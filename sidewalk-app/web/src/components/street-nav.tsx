"use client";

import { useState } from "react";
import { Flag, Plus, Trash2, X } from "lucide-react";
import type { Street } from "@/lib/types";

function RevisitBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      title={`${count} flagged for follow-up`}
      className="flex-shrink-0 flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white"
    >
      <Flag size={9} strokeWidth={3} fill="white" />
      {count}
    </span>
  );
}

function AddStreetChip({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-400"
      >
        <Plus size={16} />
      </button>
    );
  }
  const submit = () => {
    if (name.trim()) onAdd(name.trim());
    setName("");
    setAdding(false);
  };
  return (
    <div className="flex-shrink-0 flex items-center gap-1 border-2 border-black rounded-full pl-3 pr-1.5 py-1 bg-white">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setAdding(false);
            setName("");
          }
        }}
        placeholder="Street name"
        className="outline-none text-sm w-28 bg-transparent"
      />
      <button
        onClick={submit}
        disabled={!name.trim()}
        className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30"
      >
        <Plus size={14} strokeWidth={3} />
      </button>
      <button
        onClick={() => {
          setAdding(false);
          setName("");
        }}
        className="w-6 h-6 rounded-full text-gray-400 flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function StreetEditField({
  street,
  onCommit,
  onCancel,
  variant,
}: {
  street: Street;
  onCommit: (name: string) => void;
  onCancel: () => void;
  variant: "chip" | "row";
}) {
  const [draft, setDraft] = useState(street.name);
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onCommit(trimmed);
    else onCancel();
  };
  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={commit}
      className={
        "outline-none text-sm bg-transparent font-bold " +
        (variant === "chip"
          ? "w-24 flex-shrink-0 rounded-full border-2 border-black px-3 py-1.5"
          : "flex-1 min-w-0 rounded-lg border-2 border-black px-3 py-2")
      }
    />
  );
}

export function StreetNav({
  streets,
  activeStreetId,
  onSelect,
  onAdd,
  onRename,
  onDeleteRequest,
  allowAll = false,
  canDelete = true,
}: {
  streets: Street[];
  activeStreetId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDeleteRequest: (street: Street) => void;
  allowAll?: boolean;
  canDelete?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile: horizontal chip scroller */}
      <div className="md:hidden flex items-center gap-2 px-4 py-3 overflow-x-auto whitespace-nowrap border-b border-gray-200">
        {allowAll && (
          <button
            onClick={() => onSelect(null)}
            className={
              "flex-shrink-0 px-3.5 py-2 text-sm font-bold rounded-full border-2 border-black " +
              (activeStreetId === null ? "bg-black text-white" : "bg-white text-black")
            }
          >
            ALL
          </button>
        )}
        {streets.map((s) => {
          const active = activeStreetId === s.id;
          return editingId === s.id ? (
            <StreetEditField
              key={s.id}
              street={s}
              variant="chip"
              onCommit={(name) => {
                onRename(s.id, name);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={s.id}
              className={
                "flex-shrink-0 flex items-center gap-1 rounded-full border-2 border-black pl-3.5 pr-1 py-1 " +
                (active ? "bg-black text-white" : "bg-white text-black")
              }
            >
              <button
                onClick={() => (active ? setEditingId(s.id) : onSelect(s.id))}
                className="flex items-center gap-1.5 text-sm font-bold"
              >
                {s.name}
                <span
                  className={
                    "text-xs font-semibold px-1.5 py-0.5 rounded-full " +
                    (active ? "bg-white text-black" : "bg-gray-100 text-gray-500")
                  }
                >
                  {s.houseCount}
                </span>
                <RevisitBadge count={s.revisitCount} />
              </button>
              {canDelete && (
                <button
                  onClick={() => onDeleteRequest(s)}
                  title="Delete street"
                  className={"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 " + (active ? "text-gray-300" : "text-gray-400")}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
        <AddStreetChip onAdd={onAdd} />
      </div>

      {/* Tablet/desktop: persistent sidebar list */}
      <div className="hidden md:flex md:flex-col md:w-72 md:flex-shrink-0 border-r-2 border-black overflow-y-auto">
        <div className="p-3 flex flex-col gap-1.5">
          {allowAll && (
            <button
              onClick={() => onSelect(null)}
              className={
                "text-left px-3.5 py-2.5 rounded-lg border-2 border-black font-bold text-sm " +
                (activeStreetId === null ? "bg-black text-white" : "bg-white text-black")
              }
            >
              All streets
            </button>
          )}
          {streets.map((s) => {
            const active = activeStreetId === s.id;
            return editingId === s.id ? (
              <StreetEditField
                key={s.id}
                street={s}
                variant="row"
                onCommit={(name) => {
                  onRename(s.id, name);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={s.id}
                className={
                  "flex items-center gap-1 rounded-lg border-2 border-black pl-1 " +
                  (active ? "bg-black text-white" : "bg-white text-black")
                }
              >
                <button
                  onClick={() => (active ? setEditingId(s.id) : onSelect(s.id))}
                  className="flex-1 min-w-0 text-left px-2.5 py-2.5 font-bold text-sm flex items-center justify-between gap-2"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className={
                        "text-xs font-semibold px-1.5 py-0.5 rounded-full " +
                        (active ? "bg-white text-black" : "bg-gray-100 text-gray-500")
                      }
                    >
                      {s.houseCount}
                    </span>
                    <RevisitBadge count={s.revisitCount} />
                  </span>
                </button>
                {canDelete && (
                  <button
                    onClick={() => onDeleteRequest(s)}
                    title="Delete street"
                    className={"w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-1 " + (active ? "text-gray-300" : "text-gray-400")}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
          <AddStreetRow onAdd={onAdd} />
        </div>
      </div>
    </>
  );
}

function AddStreetRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border-2 border-dashed border-gray-400 text-gray-400 text-sm font-bold"
      >
        <Plus size={16} /> Add street
      </button>
    );
  }
  const submit = () => {
    if (name.trim()) onAdd(name.trim());
    setName("");
    setAdding(false);
  };
  return (
    <div className="flex items-center gap-1 border-2 border-black rounded-lg pl-3 pr-1.5 py-1.5 bg-white">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setAdding(false);
            setName("");
          }
        }}
        placeholder="Street name"
        className="outline-none text-sm flex-1 min-w-0 bg-transparent"
      />
      <button
        onClick={submit}
        disabled={!name.trim()}
        className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 flex-shrink-0"
      >
        <Plus size={14} strokeWidth={3} />
      </button>
      <button
        onClick={() => {
          setAdding(false);
          setName("");
        }}
        className="w-6 h-6 rounded-full text-gray-400 flex items-center justify-center flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
