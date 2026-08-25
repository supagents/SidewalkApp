"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Download, Plus, Trash2 } from "lucide-react";
import { ChunkyBox } from "@/components/chunky-box";
import { Toast } from "@/components/toast";
import { ConfirmDeleteModal, type ConfirmDeleteTarget } from "@/components/confirm-delete-modal";
import { StatsBar } from "@/components/stats-bar";
import { createCanvass, exportAllCanvasses, fetchCanvassHouses, subscribeCanvasses } from "@/lib/canvass-data";
import { deleteCampaign, renameCampaign, subscribeCampaign } from "@/lib/campaign";
import { downloadAllCSV } from "@/lib/csv";
import { authErrorMessage, reauthenticate } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import type { Campaign, Canvass, House } from "@/lib/types";

export function HomeScreen({
  campaignId,
  onOpenCanvass,
  onBackToCampaigns,
}: {
  campaignId: string;
  onOpenCanvass: (id: string) => void;
  onBackToCampaigns: () => void;
}) {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [canvasses, setCanvasses] = useState<Canvass[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteTarget | null>(null);
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [allHouses, setAllHouses] = useState<House[] | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => subscribeCampaign(campaignId, setCampaign), [campaignId]);
  useEffect(() => subscribeCanvasses(campaignId, setCanvasses), [campaignId]);

  // One-time read across every canvass in the campaign, only while the
  // results panel is actually open — same tradeoff as the "whole canvass"
  // stats scope in CanvassScreen, just one level up. Keyed on the set of
  // canvass IDs (not the `canvasses` array itself, which gets a new
  // reference on every doorCount/streetCount write) so this doesn't
  // re-fetch on every unrelated edit while the panel stays open.
  const canvassIdsKey = canvasses
    .map((c) => c.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (!statsPanelOpen) return;
    let cancelled = false;
    const ids = canvassIdsKey ? canvassIdsKey.split(",") : [];
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingStats(true);
      try {
        const perCanvass = await Promise.all(ids.map((id) => fetchCanvassHouses(campaignId, id)));
        if (!cancelled) setAllHouses(perCanvass.flat());
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [statsPanelOpen, campaignId, canvassIdsKey]);

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

  const startEditName = () => {
    if (!campaign) return;
    setNameDraft(campaign.name);
    setEditingName(true);
  };
  const commitName = async () => {
    setEditingName(false);
    const name = nameDraft.trim();
    if (!name || !campaign || name === campaign.name) return;
    try {
      await renameCampaign(campaignId, name);
    } catch {
      flashError("Couldn't rename campaign.");
    }
  };

  const confirmDeleteNow = async (password?: string) => {
    if (!confirmDelete || !user) return;
    try {
      await reauthenticate(password ?? "");
    } catch (err) {
      throw new Error(authErrorMessage(err));
    }
    try {
      await deleteCampaign(user.uid, confirmDelete.id);
    } catch {
      throw new Error("Couldn't delete campaign. Try again.");
    }
    setConfirmDelete(null);
    onBackToCampaigns();
  };

  const streetTotal = canvasses.reduce((sum, c) => sum + c.streetCount, 0);

  return (
    <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
      <div className="px-4 pt-6 pb-5 flex items-center gap-3">
        <button onClick={onBackToCampaigns} className="p-1.5 -ml-1.5 border-2 border-black rounded-lg bg-white flex-shrink-0">
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") setEditingName(false);
              }}
              onBlur={commitName}
              className="font-bold w-full outline-none border-b-2 border-black bg-transparent"
            />
          ) : (
            <button onClick={startEditName} className="font-bold truncate text-left block w-full">
              {campaign?.name ?? "…"}
            </button>
          )}
          <div className="text-xs text-gray-500 uppercase tracking-wide">Campaign</div>
        </div>
        <button
          onClick={() => setStatsPanelOpen((v) => !v)}
          title="Results"
          className={"p-1.5 border-2 border-black rounded-lg flex-shrink-0 " + (statsPanelOpen ? "bg-black text-white" : "bg-white")}
        >
          <BarChart3 size={18} strokeWidth={2.5} />
        </button>
        {canvasses.length > 0 && (
          <button
            onClick={handleExportAll}
            disabled={exporting}
            title="Export all canvasses"
            className="p-1.5 border-2 border-black rounded-lg bg-white disabled:opacity-40 flex-shrink-0"
          >
            <Download size={18} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={() => campaign && setConfirmDelete({ type: "campaign", id: campaignId, label: campaign.name })}
          title="Delete campaign"
          className="p-1.5 border-2 border-black rounded-lg bg-white flex-shrink-0"
        >
          <Trash2 size={18} strokeWidth={2.5} />
        </button>
      </div>

      {statsPanelOpen && (
        <div className="mx-5 mb-3 p-3.5 border-2 border-black rounded-xl bg-white">
          {loadingStats || allHouses === null ? (
            <div className="text-xs text-gray-400 text-center py-4">Loading…</div>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-2">
                {streetTotal} street{streetTotal === 1 ? "" : "s"}
              </div>
              <StatsBar houses={allHouses} label={campaign?.name ?? "All canvasses"} />
            </>
          )}
        </div>
      )}

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
                      {c.revisitCount > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-red-600">
                          <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                          {c.revisitCount} flagged
                        </div>
                      )}
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

      {confirmDelete && (
        <ConfirmDeleteModal target={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteNow} />
      )}
      <Toast message={error} />
    </div>
  );
}
