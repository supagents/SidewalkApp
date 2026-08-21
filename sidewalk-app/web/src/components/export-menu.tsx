"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { EXPORT_CATEGORIES, type ExportCategory } from "@/lib/csv";

export function ExportMenu({
  disabled,
  onExport,
}: {
  disabled: boolean;
  onExport: (category: ExportCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title="Export CSV"
        className={
          "p-1.5 border-2 border-black rounded-lg flex-shrink-0 disabled:opacity-40 " + (open ? "bg-black text-white" : "bg-white")
        }
      >
        <Download size={18} strokeWidth={2.5} />
      </button>
      {open && (
        // z-[2000]: same reasoning as ConfirmDeleteModal/Toast — must beat Leaflet's own z-index range
        // when the menu opens while the Map tab is showing.
        <div className="absolute right-0 top-[calc(100%+6px)] z-[2000] bg-white border-2 border-black rounded-xl overflow-hidden w-44 shadow-sm">
          {EXPORT_CATEGORIES.map((c, i) => (
            <button
              key={c.key}
              onClick={() => {
                setOpen(false);
                onExport(c);
              }}
              className={"w-full text-left px-3.5 py-2.5 text-sm font-semibold " + (i > 0 ? "border-t border-gray-200" : "")}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
