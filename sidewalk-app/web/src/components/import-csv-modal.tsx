"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { parseVoterListCSV, type ParsedImport } from "@/lib/voter-import";
import type { Street } from "@/lib/types";

export function ImportCSVModal({
  streets,
  onCancel,
  onImport,
}: {
  streets: Street[];
  onCancel: () => void;
  onImport: (parsed: ParsedImport) => Promise<void>;
}) {
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingNames = new Set(streets.map((s) => s.name.trim().toLowerCase()));
  const newStreetCount = parsed ? parsed.streets.filter((s) => !existingNames.has(s.name.trim().toLowerCase())).length : 0;
  const totalHouses = parsed ? parsed.streets.reduce((sum, s) => sum + s.houses.length, 0) : 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setParsed(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = parseVoterListCSV(String(ev.target?.result || ""));
        if (result.streets.length === 0) {
          setError("No usable rows found in that file.");
          return;
        }
        setParsed(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't read that file.");
      }
    };
    reader.readAsText(file);
  };

  const confirm = async () => {
    if (!parsed || importing) return;
    setImporting(true);
    setError("");
    try {
      await onImport(parsed);
    } catch {
      setError("Import failed partway through — check the street/house list for what landed, then try again for anything missing.");
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-[2000]">
      <div className="bg-white border-2 border-black rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1.5">
          <div className="font-bold text-base">Import voter list</div>
          <button onClick={onCancel} disabled={importing} className="p-1 text-gray-400 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>
        <div className="text-sm text-gray-500 mb-4 leading-relaxed">
          Upload a CSV with <span className="font-semibold text-black">house_number</span> and{" "}
          <span className="font-semibold text-black">street</span> columns — plus optional first_name, last_name,
          phone, email, city, state. Houses land under the matching street (created automatically if it doesn&apos;t
          exist yet), sorted by house number. Name, phone, and email go into each house&apos;s notes.
        </div>

        {!parsed ? (
          <>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-black rounded-lg py-3 font-bold text-sm"
            >
              <Upload size={16} strokeWidth={2.5} /> CHOOSE CSV FILE
            </button>
          </>
        ) : (
          <>
            <div className="border-2 border-black rounded-lg p-3 mb-3 text-sm leading-relaxed">
              <div className="font-bold mb-1">
                {totalHouses} house{totalHouses === 1 ? "" : "s"} across {parsed.streets.length} street
                {parsed.streets.length === 1 ? "" : "s"}
              </div>
              <div className="text-gray-500">
                {newStreetCount} new street{newStreetCount === 1 ? "" : "s"} will be created
                {parsed.skippedRows > 0 && (
                  <>
                    {" "}
                    · {parsed.skippedRows} row{parsed.skippedRows === 1 ? "" : "s"} skipped (missing house number or
                    street)
                  </>
                )}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4 max-h-48 overflow-y-auto">
              {parsed.streets.map((s) => (
                <div key={s.name} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-semibold truncate">{s.name}</span>
                  <span className="text-gray-400 flex-shrink-0 ml-2">
                    {s.houses.length}
                    {!existingNames.has(s.name.trim().toLowerCase()) && " · new"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <div className="text-xs text-red-600 mb-3 leading-relaxed">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={importing}
            className="flex-1 border-2 border-black rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
          >
            CANCEL
          </button>
          {parsed && (
            <button
              onClick={confirm}
              disabled={importing}
              className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
            >
              {importing ? "IMPORTING…" : "IMPORT"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
