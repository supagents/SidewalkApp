"use client";

import { useRef, useState } from "react";
import { ListPlus, Upload } from "lucide-react";
import { ChunkyBox } from "@/components/chunky-box";

export function AddHouseBar({ onAdd }: { onAdd: (raw: string) => void }) {
  const [value, setValue] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = (raw: string) => {
    if (!raw.trim()) return;
    onAdd(raw);
    setValue("");
    inputRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (/[\s,]/.test(pasted.trim())) {
      e.preventDefault();
      submit(pasted);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      submit(String(ev.target?.result || ""));
      setBulkOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="sticky bottom-0 bg-white border-t-2 border-black px-3 pt-2.5 pb-3">
      {bulkOpen && (
        <div className="mb-2.5 border-2 border-black rounded-xl p-3 bg-white">
          <div className="text-xs font-bold mb-1.5">Import house numbers</div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 border-2 border-black rounded-lg py-2.5 font-bold text-sm mb-2.5"
          >
            <Upload size={16} strokeWidth={2.5} /> UPLOAD A CSV OR TXT FILE
          </button>

          <div className="text-xs text-gray-400 text-center mb-2.5">or paste a list below</div>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"142\n144\n146  — or  142, 144, 146"}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-black resize-none mb-2.5"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                submit(bulkText);
                setBulkText("");
                setBulkOpen(false);
              }}
              disabled={!bulkText.trim()}
              className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-30"
            >
              ADD ALL
            </button>
            <button
              onClick={() => {
                setBulkOpen(false);
                setBulkText("");
              }}
              className="px-4 py-2.5 border-2 border-black rounded-lg font-bold text-sm"
            >
              CANCEL
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2 leading-relaxed">
            Works with a plain list of house numbers, one per line or comma-separated — like a single
            column exported from a spreadsheet or voter file.
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(value)}
          onPaste={handlePaste}
          placeholder="House number"
          className="flex-1 border-2 border-black rounded-xl px-3.5 py-3 text-base outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
        />
        <button
          onClick={() => setBulkOpen((v) => !v)}
          title="Import a list"
          className={"p-3 border-2 border-black rounded-xl flex-shrink-0 " + (bulkOpen ? "bg-black text-white" : "bg-white")}
        >
          <ListPlus size={20} strokeWidth={2.5} />
        </button>
        <ChunkyBox rounded="rounded-xl" offset="translate-x-1 translate-y-1">
          <button
            onClick={() => submit(value)}
            disabled={!value.trim()}
            className="px-5 py-3 font-bold rounded-xl disabled:opacity-30"
          >
            ADD
          </button>
        </ChunkyBox>
      </div>
    </div>
  );
}
