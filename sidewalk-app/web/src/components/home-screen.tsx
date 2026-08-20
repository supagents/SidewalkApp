"use client";

import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { ChunkyBox } from "@/components/chunky-box";
import { Logo } from "@/components/logo";
import { Toast } from "@/components/toast";
import { createCanvass, exportAllCanvasses, subscribeCanvasses } from "@/lib/canvass-data";
import { downloadAllCSV } from "@/lib/csv";
import { logOut } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import type { Canvass } from "@/lib/types";

export function HomeScreen({ campaignId, onOpenCanvass }: { campaignId: string; onOpenCanvass: (id: string) => void }) {
  const { user } = useAuth();
  const [canvasses, setCanvasses] = useState<Canvass[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => subscribeCanvasses(campaignId, setCanvasses), [campaignId]);

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !user) return;
    try {
      const id = await createCanvass(campaignId, name, user.uid, newCity.trim(), newState.trim());
      setNewName("");
      setNewCity("");
      setNewState("");
      setCreating(false);
      onOpenCanvass(id);
    } catch {
      flashError("Couldn't create canvass.");
    }
  };

  const handleExportAll = async () => {
    if (canvasses.length === 0 || exporting) return;
    setExporting(true);
    try {
      const data = await exportAllCanvasses(campaignId, canvasses);
      downloadAllCSV(data);
    } catch {
      flashError("Couldn't export. Try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
      <div className="px-5 pt-7 pb-5 flex items-start justify-between">
        <div>
          <Logo />
          <div className="text-xs text-gray-500 ml-5 mt-0.5">Hi {user?.email}</div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          {canvasses.length > 0 && (
            <button
              onClick={handleExportAll}
              disabled={exporting}
              title="Export all canvasses"
              className="p-1.5 border-2 border-black rounded-lg bg-white disabled:opacity-40"
            >
              <Download size={18} strokeWidth={2.5} />
            </button>
          )}
          <button onClick={() => logOut()} title="Log out" className="text-xs font-semibold text-gray-500 underline underline-offset-2">
            Log out
          </button>
        </div>
      </div>

      <div className="px-5 pb-3">
        {!creating ? (
          <ChunkyBox rounded="rounded-xl">
            <button
              onClick={() => setCreating(true)}
              className="w-full py-3.5 font-bold tracking-wide rounded-xl flex items-center justify-center gap-2"
            >
              <Plus size={18} strokeWidth={3} /> NEW CANVASS
            </button>
          </ChunkyBox>
        ) : (
          <div className="bg-white border-2 border-black rounded-xl p-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Name this canvass (e.g. Elm St loop)"
              className="w-full outline-none text-base mb-2.5"
            />
            <div className="flex gap-2 mb-3">
              <input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="City"
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-black"
              />
              <input
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="State"
                className="w-20 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div className="text-xs text-gray-400 mb-3 leading-relaxed">
              City/state power the map view — each house&apos;s address is built from its street plus
              this. You can set it later too.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold disabled:opacity-30"
              >
                START
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                  setNewCity("");
                  setNewState("");
                }}
                className="px-4 py-2.5 border-2 border-black rounded-lg font-bold"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-5 pb-8">
        {canvasses.length === 0 ? (
          <div className="text-sm text-gray-400 mt-10 text-center leading-relaxed">
            No canvasses yet.
            <br />
            Start one above and add your first street.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canvasses.map((c) => (
              <button key={c.id} onClick={() => onOpenCanvass(c.id)} className="text-left">
                <ChunkyBox rounded="rounded-xl" offset="translate-x-1 translate-y-1">
                  <div className="px-4 py-3.5 flex items-center justify-between rounded-xl">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">
                        {c.streetCount} street{c.streetCount === 1 ? "" : "s"} · {c.doorCount} door
                        {c.doorCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 ml-3">
                      ›
                    </div>
                  </div>
                </ChunkyBox>
              </button>
            ))}
          </div>
        )}
      </div>
      <Toast message={error} />
    </div>
  );
}
