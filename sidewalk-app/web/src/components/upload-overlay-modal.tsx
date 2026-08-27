"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

export function UploadOverlayModal({
  onCancel,
  onUpload,
}: {
  onCancel: () => void;
  onUpload: (name: string, file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(f);
    setError("");
    if (!name.trim()) setName(f.name.replace(/\.(geojson|json|kml|zip)$/i, ""));
  };

  const confirm = async () => {
    if (!file || !name.trim() || uploading) return;
    setUploading(true);
    setError("");
    try {
      await onUpload(name.trim(), file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that layer. Try again.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-6 z-[2000]">
      <div className="bg-white border-2 border-black rounded-2xl p-5 w-full max-w-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div className="font-bold text-base">Add a boundary layer</div>
          <button onClick={onCancel} disabled={uploading} className="p-1 text-gray-400 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>
        <div className="text-sm text-gray-500 mb-4 leading-relaxed">
          Upload a ward, riding, poll, or any other boundary file — GeoJSON, KML, or a zipped Shapefile
          (.zip with .shp/.dbf/.prj inside). It overlays on the map for everyone on this canvass, and
          toggles on or off from the layers list.
        </div>

        <input ref={fileInputRef} type="file" accept=".geojson,.json,.kml,.zip" onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-black rounded-lg py-3 font-bold text-sm mb-3 truncate px-3"
        >
          <Upload size={16} strokeWidth={2.5} className="flex-shrink-0" />
          <span className="truncate">{file ? file.name : "CHOOSE FILE"}</span>
        </button>

        {file && (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
            placeholder="Layer name (e.g. Ward 3)"
            className="w-full border-2 border-black rounded-lg px-3 py-2.5 text-sm outline-none mb-3"
          />
        )}

        {error && <div className="text-xs text-red-600 mb-3 leading-relaxed">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 border-2 border-black rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
          >
            CANCEL
          </button>
          <button
            onClick={confirm}
            disabled={!file || !name.trim() || uploading}
            className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
          >
            {uploading ? "ADDING…" : "ADD LAYER"}
          </button>
        </div>
      </div>
    </div>
  );
}
