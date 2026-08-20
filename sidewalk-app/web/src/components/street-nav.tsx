"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Street } from "@/lib/types";

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
  onDelete,
  variant,
}: {
  street: Street;
  onCommit: (name: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  variant: "chip" | "row";
}) {
  const [draft, setDraft] = useState(street.name);
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onCommit(trimmed);
    else onCancel();
  };
  return (
    <div
      className={
        variant === "chip"
          ? "flex-shrink-0 flex items-center gap-1 border-2 border-black rounded-full pl-3 pr-1.5 py-1 bg-white"
          : "flex items-center gap-1 border-2 border-black rounded-lg pl-3 pr-1.5 py-1.5 bg-white"
      }
    >
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
        className={"outline-none text-sm bg-transparent font-bold " + (variant === "chip" ? "w-28" : "flex-1 min-w-0")}
      />
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDelete}
        className="w-6 h-6 rounded-full text-gray-400 flex items-center justify-center flex-shrink-0"
        title="Delete street"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function StreetNav({
  streets,
  activeStreetId,
  onSelect,
  onAdd,
  onRename,
  onDeleteRequest,
}: {
  streets: Street[];
  activeStreetId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDeleteRequest: (street: Street) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile: horizontal chip scroller */}
      <div className="md:hidden flex items-center gap-2 px-4 py-3 overflow-x-auto whitespace-nowrap border-b border-gray-200">
        {streets.map((s) =>
          editingId === s.id ? (
            <StreetEditField
              key={s.id}
              street={s}
              variant="chip"
              onCommit={(name) => {
                onRename(s.id, name);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
              onDelete={() => onDeleteRequest(s)}
            />
          ) : (
            <button
              key={s.id}
              onClick={() => (activeStreetId === s.id ? setEditingId(s.id) : onSelect(s.id))}
              className={
                "flex-shrink-0 px-3.5 py-2 text-sm font-bold rounded-full border-2 border-black flex items-center gap-1.5 " +
                (activeStreetId === s.id ? "bg-black text-white" : "bg-white text-black")
              }
            >
              {s.name}
              <span
                className={
                  "text-xs font-semibold px-1.5 py-0.5 rounded-full " +
                  (activeStreetId === s.id ? "bg-white text-black" : "bg-gray-100 text-gray-500")
                }
              >
                {s.houseCount}
              </span>
            </button>
          )
        )}
        <AddStreetChip onAdd={onAdd} />
      </div>

      {/* Tablet/desktop: persistent sidebar list */}
      <div className="hidden md:flex md:flex-col md:w-72 md:flex-shrink-0 border-r-2 border-black overflow-y-auto">
        <div className="p-3 flex flex-col gap-1.5">
          {streets.map((s) =>
            editingId === s.id ? (
              <StreetEditField
                key={s.id}
                street={s}
                variant="row"
                onCommit={(name) => {
                  onRename(s.id, name);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                onDelete={() => onDeleteRequest(s)}
              />
            ) : (
              <button
                key={s.id}
                onClick={() => (activeStreetId === s.id ? setEditingId(s.id) : onSelect(s.id))}
                className={
                  "text-left px-3.5 py-2.5 rounded-lg border-2 border-black font-bold text-sm flex items-center justify-between gap-2 " +
                  (activeStreetId === s.id ? "bg-black text-white" : "bg-white text-black")
                }
              >
                <span className="truncate">{s.name}</span>
                <span
                  className={
                    "text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 " +
                    (activeStreetId === s.id ? "bg-white text-black" : "bg-gray-100 text-gray-500")
                  }
                >
                  {s.houseCount}
                </span>
              </button>
            )
          )}
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
