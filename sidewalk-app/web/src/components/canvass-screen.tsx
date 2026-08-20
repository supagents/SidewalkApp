"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Download, Share2 } from "lucide-react";
import {
  addHouses,
  addStreet,
  deleteHouse,
  deleteStreet,
  exportCanvass,
  renameCanvass,
  renameStreet,
  subscribeCanvass,
  subscribeHouses,
  subscribeStreets,
  updateHouse,
} from "@/lib/canvass-data";
import { downloadCanvassCSV } from "@/lib/csv";
import type { Canvass, House, Street } from "@/lib/types";
import { StreetNav } from "@/components/street-nav";
import { HouseList } from "@/components/house-list";
import { AddHouseBar } from "@/components/add-house-bar";
import { ConfirmDeleteModal, type ConfirmDeleteTarget } from "@/components/confirm-delete-modal";
import { StatsBar } from "@/components/stats-bar";
import { SharePanel } from "@/components/share-panel";
import { Toast } from "@/components/toast";
import { logOut } from "@/lib/auth";
import { clearGuestSession } from "@/lib/share";

export function CanvassScreen({
  campaignId,
  canvassId,
  onBack,
  isGuest = false,
}: {
  campaignId: string;
  canvassId: string;
  onBack: () => void;
  isGuest?: boolean;
}) {
  const [canvass, setCanvass] = useState<Canvass | null>(null);
  const [streets, setStreets] = useState<Street[]>([]);
  const [activeStreetId, setActiveStreetId] = useState<string | null>(null);
  const [activeHouses, setActiveHouses] = useState<House[]>([]);
  const [expandedHouseId, setExpandedHouseId] = useState<string | null>(null);
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [statsScope, setStatsScope] = useState<"street" | "canvass">("street");
  const [canvassWideHouses, setCanvassWideHouses] = useState<House[] | null>(null);
  const [loadingCanvassStats, setLoadingCanvassStats] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteTarget | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  useEffect(() => subscribeCanvass(campaignId, canvassId, setCanvass), [campaignId, canvassId]);

  useEffect(() => {
    return subscribeStreets(campaignId, canvassId, (list) => {
      setStreets(list);
      setActiveStreetId((current) => {
        if (current && list.some((s) => s.id === current)) return current;
        return list[0]?.id ?? null;
      });
    });
  }, [campaignId, canvassId]);

  useEffect(() => {
    if (!activeStreetId) return;
    return subscribeHouses(campaignId, canvassId, activeStreetId, setActiveHouses);
  }, [campaignId, canvassId, activeStreetId]);

  // Only pull every street's houses (a one-time read, not a live
  // subscription) when the results panel actually needs the "whole
  // canvass" breakdown — no point keeping N listeners open otherwise.
  useEffect(() => {
    if (!statsPanelOpen || statsScope !== "canvass" || !canvass) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingCanvassStats(true);
      try {
        const data = await exportCanvass(campaignId, canvass);
        if (!cancelled) setCanvassWideHouses(data.streets.flatMap((s) => s.houses));
      } finally {
        if (!cancelled) setLoadingCanvassStats(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [statsPanelOpen, statsScope, campaignId, canvass]);

  if (!canvass) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm tracking-[0.2em] text-gray-400 font-semibold">LOADING</div>
      </div>
    );
  }

  const activeStreet = streets.find((s) => s.id === activeStreetId) || null;

  const startEditName = () => {
    setNameDraft(canvass.name);
    setEditingName(true);
  };
  const commitName = async () => {
    setEditingName(false);
    const name = nameDraft.trim();
    if (!name || name === canvass.name) return;
    await renameCanvass(campaignId, canvassId, name);
  };

  const handleAddStreet = async (name: string) => {
    try {
      const id = await addStreet(campaignId, canvassId, name);
      setActiveStreetId(id);
    } catch {
      flashError("Couldn't add street.");
    }
  };

  const handleAddHouses = async (raw: string) => {
    if (!activeStreetId) return;
    try {
      const existing = new Set(activeHouses.map((h) => h.number));
      const added = await addHouses(campaignId, canvassId, activeStreetId, raw, existing);
      if (added === 0) flashError("Those numbers are already logged on this street.");
      else if (added > 1) flashError(`Added ${added} houses.`);
    } catch {
      flashError("Couldn't add houses.");
    }
  };

  const updateActiveHouse = async (houseId: string, patch: Partial<House>) => {
    if (!activeStreetId) return;
    try {
      await updateHouse(campaignId, canvassId, activeStreetId, houseId, patch);
    } catch {
      flashError("Couldn't save. Check your connection.");
    }
  };

  const confirmDeleteNow = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === "street") {
        await deleteStreet(campaignId, canvassId, confirmDelete.id);
      } else if (activeStreetId) {
        await deleteHouse(campaignId, canvassId, activeStreetId, confirmDelete.id);
        if (expandedHouseId === confirmDelete.id) setExpandedHouseId(null);
      }
    } catch {
      flashError("Couldn't delete. Try again.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportCanvass(campaignId, canvass);
      downloadCanvassCSV(data);
    } catch {
      flashError("Couldn't export. Try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        {isGuest ? (
          <button
            onClick={() => {
              clearGuestSession();
              logOut();
            }}
            className="text-xs font-semibold text-gray-500 underline underline-offset-2 flex-shrink-0"
          >
            Leave
          </button>
        ) : (
          <button onClick={onBack} className="p-1.5 -ml-1.5 border-2 border-black rounded-lg bg-white">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        )}
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
              {canvass.name}
            </button>
          )}
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {canvass.streetCount} street{canvass.streetCount === 1 ? "" : "s"} · {canvass.doorCount} door
            {canvass.doorCount === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={() => {
            setStatsPanelOpen((v) => !v);
            setSharePanelOpen(false);
          }}
          title="Results"
          className={"p-1.5 border-2 border-black rounded-lg flex-shrink-0 " + (statsPanelOpen ? "bg-black text-white" : "bg-white")}
        >
          <BarChart3 size={18} strokeWidth={2.5} />
        </button>
        {!isGuest && (
          <button
            onClick={() => {
              setSharePanelOpen((v) => !v);
              setStatsPanelOpen(false);
            }}
            title="Share"
            className={"p-1.5 border-2 border-black rounded-lg flex-shrink-0 " + (sharePanelOpen ? "bg-black text-white" : "bg-white")}
          >
            <Share2 size={18} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          title="Export CSV"
          className="p-1.5 border-2 border-black rounded-lg bg-white flex-shrink-0 disabled:opacity-40"
        >
          <Download size={18} strokeWidth={2.5} />
        </button>
      </div>

      {sharePanelOpen && !isGuest && (
        <SharePanel campaignId={campaignId} canvass={canvass} createdBy={canvass.createdBy} onError={flashError} />
      )}

      {statsPanelOpen && (
        <div className="mx-4 mb-3 p-3.5 border-2 border-black rounded-xl bg-white">
          <div className="flex border-2 border-black rounded-lg overflow-hidden mb-3.5 text-xs font-bold">
            <button
              onClick={() => setStatsScope("street")}
              className={"flex-1 py-2 " + (statsScope === "street" ? "bg-black text-white" : "bg-white")}
              disabled={!activeStreet}
            >
              THIS STREET
            </button>
            <button
              onClick={() => setStatsScope("canvass")}
              className={"flex-1 py-2 border-l-2 border-black " + (statsScope === "canvass" ? "bg-black text-white" : "bg-white")}
            >
              WHOLE CANVASS
            </button>
          </div>
          {statsScope === "canvass" && loadingCanvassStats ? (
            <div className="text-xs text-gray-400 text-center py-4">Loading…</div>
          ) : (
            <StatsBar
              houses={statsScope === "street" && activeStreet ? activeHouses : canvassWideHouses ?? []}
              label={statsScope === "street" && activeStreet ? activeStreet.name : canvass.name}
            />
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
        <StreetNav
          streets={streets}
          activeStreetId={activeStreetId}
          onSelect={setActiveStreetId}
          onAdd={handleAddStreet}
          onRename={(id, name) => renameStreet(campaignId, canvassId, id, name).catch(() => flashError("Couldn't rename street."))}
          onDeleteRequest={(s) => setConfirmDelete({ type: "street", id: s.id, label: s.name })}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 pt-3">
            <HouseList
              street={activeStreet}
              houses={activeHouses}
              expandedHouseId={expandedHouseId}
              onToggleExpand={(id) => setExpandedHouseId((cur) => (cur === id ? null : id))}
              onStatusChange={(id, status) => updateActiveHouse(id, { status })}
              onLawnSignToggle={(id) => {
                const h = activeHouses.find((x) => x.id === id);
                if (h) updateActiveHouse(id, { lawnSign: !h.lawnSign });
              }}
              onRevisitToggle={(id) => {
                const h = activeHouses.find((x) => x.id === id);
                if (h) updateActiveHouse(id, { revisit: !h.revisit });
              }}
              onNumberChange={(id, number) => updateActiveHouse(id, { number })}
              onNotesChange={(id, notes) => updateActiveHouse(id, { notes })}
              onDelete={(id) => {
                const h = activeHouses.find((x) => x.id === id);
                setConfirmDelete({ type: "house", id, label: `house ${h?.number ?? ""}` });
              }}
            />
          </div>
          {activeStreet && <AddHouseBar onAdd={handleAddHouses} />}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDeleteModal target={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteNow} />
      )}
      <Toast message={error} />
    </div>
  );
}
