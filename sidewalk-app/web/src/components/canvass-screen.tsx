"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, BarChart3, MapIcon, Share2, Trash2, Upload } from "lucide-react";
import {
  addHouses,
  addStreet,
  deleteCanvass,
  deleteHouse,
  deleteStreet,
  exportCanvass,
  fetchCanvassHouses,
  importVoterList,
  renameCanvass,
  renameStreet,
  subscribeCanvass,
  subscribeHouses,
  subscribeStreets,
  toggleHouseLawnSign,
  toggleHouseRevisit,
  updateCanvassLocation,
  updateHouse,
} from "@/lib/canvass-data";
import { downloadCanvassCSV, type ExportCategory } from "@/lib/csv";
import type { ParsedImport } from "@/lib/voter-import";
import { deleteMapOverlay, subscribeMapOverlays, uploadMapOverlay, type MapOverlay } from "@/lib/map-overlays";
import type { Canvass, House, Street, StreetType } from "@/lib/types";
import { StreetNav } from "@/components/street-nav";
import { HouseList } from "@/components/house-list";
import { AddHouseBar } from "@/components/add-house-bar";
import { ConfirmDeleteModal, type ConfirmDeleteTarget } from "@/components/confirm-delete-modal";
import { ImportCSVModal } from "@/components/import-csv-modal";
import { LoadingScreen } from "@/components/loading-screen";
import { StatsBar } from "@/components/stats-bar";
import { SharePanel } from "@/components/share-panel";
import { ExportMenu } from "@/components/export-menu";
import { Toast } from "@/components/toast";
import { authErrorMessage, logOut, reauthenticate } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { clearGuestSession } from "@/lib/share";

// Leaflet needs `window` and touches the DOM directly, so it can never
// run during SSR — and loading it only via this dynamic import means
// its JS/CSS chunk isn't fetched at all until the Map tab is opened.
const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-sm tracking-[0.2em] text-gray-400 font-semibold">LOADING MAP</div>
    </div>
  ),
});

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
  const { user } = useAuth();
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
  const [editingLocation, setEditingLocation] = useState(false);
  const [cityDraft, setCityDraft] = useState("");
  const [stateDraft, setStateDraft] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapStreetId, setMapStreetId] = useState<string | null>(null);
  const [mapHouses, setMapHouses] = useState<House[]>([]);
  const [loadingMapHouses, setLoadingMapHouses] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [overlays, setOverlays] = useState<MapOverlay[]>([]);

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
      // Unlike the list view, "no street selected" is a valid map
      // state (whole canvass) — so if the street the map was filtered
      // to just got deleted, fall back to "All" instead of picking an
      // arbitrary replacement street.
      setMapStreetId((current) => (current && !list.some((s) => s.id === current) ? null : current));
    });
  }, [campaignId, canvassId]);

  useEffect(() => {
    if (!activeStreetId) return;
    return subscribeHouses(campaignId, canvassId, activeStreetId, setActiveHouses);
  }, [campaignId, canvassId, activeStreetId]);

  // Map data loads only while the Map tab is open. A single street
  // uses a live subscription (same as the list view); "All" is a
  // one-time full-canvass read — matches the same tradeoff already
  // made for the "whole canvass" results scope, avoiding a listener
  // per street just to support a view most sessions won't open.
  useEffect(() => {
    if (viewMode !== "map") return;
    if (mapStreetId) {
      return subscribeHouses(campaignId, canvassId, mapStreetId, setMapHouses);
    }
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingMapHouses(true);
      try {
        const houses = await fetchCanvassHouses(campaignId, canvassId);
        if (!cancelled) setMapHouses(houses);
      } finally {
        if (!cancelled) setLoadingMapHouses(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [viewMode, mapStreetId, campaignId, canvassId]);

  // Boundary layers (ward/riding/poll/etc.) are only relevant on the map,
  // and can carry a fair amount of GeoJSON — same "only while the tab is
  // open" gating as the map houses fetch above, so this data isn't pulled
  // down on every canvass visit.
  useEffect(() => {
    if (viewMode !== "map") return;
    return subscribeMapOverlays(campaignId, canvassId, setOverlays);
  }, [viewMode, campaignId, canvassId]);

  // Only pull every street's houses (a one-time read, not a live
  // subscription) when the results panel actually needs the "whole
  // canvass" breakdown — no point keeping N listeners open otherwise.
  useEffect(() => {
    if (!statsPanelOpen || statsScope !== "canvass") return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingCanvassStats(true);
      try {
        const houses = await fetchCanvassHouses(campaignId, canvassId);
        if (!cancelled) setCanvassWideHouses(houses);
      } finally {
        if (!cancelled) setLoadingCanvassStats(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [statsPanelOpen, statsScope, campaignId, canvassId]);

  if (!canvass) {
    return <LoadingScreen />;
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

  const startEditLocation = () => {
    setCityDraft(canvass.city);
    setStateDraft(canvass.state);
    setEditingLocation(true);
  };
  const commitLocation = async () => {
    setEditingLocation(false);
    const city = cityDraft.trim();
    const state = stateDraft.trim();
    if (city === canvass.city && state === canvass.state) return;
    try {
      await updateCanvassLocation(campaignId, canvassId, city, state);
    } catch {
      flashError("Couldn't save city/state.");
    }
  };

  const handleAddStreet = async (name: string, type: StreetType = "street", address?: string) => {
    try {
      const id = await addStreet(campaignId, canvassId, name, type, address);
      setActiveStreetId(id);
    } catch {
      flashError(type === "condo" ? "Couldn't add condo." : "Couldn't add street.");
    }
  };

  const handleAddHouses = async (raw: string) => {
    if (!activeStreetId || !activeStreet) return;
    const unitWord = activeStreet.type === "condo" ? "units" : "houses";
    try {
      const existing = new Set(activeHouses.map((h) => h.number));
      const added = await addHouses(campaignId, canvassId, activeStreet, raw, existing, canvass.city, canvass.state);
      if (added === 0) flashError(`Those numbers are already logged on this ${activeStreet.type === "condo" ? "condo" : "street"}.`);
      else if (added > 1) flashError(`Added ${added} ${unitWord}.`);
    } catch {
      flashError(`Couldn't add ${unitWord}.`);
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

  const handleRevisitToggle = async (houseId: string) => {
    if (!activeStreetId) return;
    const h = activeHouses.find((x) => x.id === houseId);
    if (!h) return;
    try {
      await toggleHouseRevisit(campaignId, canvassId, activeStreetId, houseId, !h.revisit);
    } catch {
      flashError("Couldn't save. Check your connection.");
    }
  };

  const handleLawnSignToggle = async (houseId: string) => {
    if (!activeStreetId) return;
    const h = activeHouses.find((x) => x.id === houseId);
    if (!h) return;
    try {
      await toggleHouseLawnSign(campaignId, canvassId, activeStreetId, houseId, !h.lawnSign);
    } catch {
      flashError("Couldn't save. Check your connection.");
    }
  };

  const confirmDeleteNow = async (password?: string) => {
    if (!confirmDelete) return;

    if (confirmDelete.type === "canvass") {
      try {
        await reauthenticate(password ?? "");
      } catch (err) {
        throw new Error(authErrorMessage(err));
      }
      try {
        await deleteCanvass(campaignId, confirmDelete.id);
      } catch {
        throw new Error("Couldn't delete canvass. Try again.");
      }
      setConfirmDelete(null);
      onBack();
      return;
    }

    try {
      if (confirmDelete.type === "street") {
        await deleteStreet(campaignId, canvassId, confirmDelete.id);
      } else if (activeStreetId) {
        const h = activeHouses.find((x) => x.id === confirmDelete.id);
        await deleteHouse(campaignId, canvassId, activeStreetId, confirmDelete.id, !!h?.revisit, !!h?.lawnSign);
        if (expandedHouseId === confirmDelete.id) setExpandedHouseId(null);
      }
    } catch {
      throw new Error("Couldn't delete. Try again.");
    }
    setConfirmDelete(null);
  };

  const handleExport = async (category: ExportCategory) => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportCanvass(campaignId, canvass);
      downloadCanvassCSV(data, category);
    } catch {
      flashError("Couldn't export. Try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportVoterList = async (parsed: ParsedImport) => {
    const result = await importVoterList(campaignId, canvassId, parsed, streets, canvass.city, canvass.state);
    setImportOpen(false);
    flashError(
      `Imported ${result.housesAdded} house${result.housesAdded === 1 ? "" : "s"}` +
        (result.streetsCreated > 0 ? `, created ${result.streetsCreated} street${result.streetsCreated === 1 ? "" : "s"}` : "") +
        (result.housesSkipped > 0 ? `, skipped ${result.housesSkipped} already logged` : "") +
        "."
    );
  };

  const handleUploadOverlay = async (name: string, file: File) => {
    if (!user) return;
    await uploadMapOverlay(campaignId, canvassId, user.uid, name, file, overlays.length);
  };

  const handleDeleteOverlay = (id: string) => {
    deleteMapOverlay(campaignId, canvassId, id).catch(() => flashError("Couldn't delete that layer."));
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
          {canvass.revisitCount > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
              {canvass.revisitCount} flagged for follow-up
            </div>
          )}
          {editingLocation ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                autoFocus
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitLocation();
                  if (e.key === "Escape") setEditingLocation(false);
                }}
                placeholder="City"
                className="w-20 text-xs border-b-2 border-black bg-transparent outline-none"
              />
              <input
                value={stateDraft}
                onChange={(e) => setStateDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitLocation();
                  if (e.key === "Escape") setEditingLocation(false);
                }}
                onBlur={commitLocation}
                placeholder="State"
                className="w-14 text-xs border-b-2 border-black bg-transparent outline-none"
              />
            </div>
          ) : (
            <button onClick={startEditLocation} className="text-xs text-gray-400 mt-0.5 underline underline-offset-2">
              {canvass.city || canvass.state
                ? [canvass.city, canvass.state].filter(Boolean).join(", ")
                : "Set city/state for map pins"}
            </button>
          )}
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
        <ExportMenu disabled={exporting} onExport={handleExport} />
        {!isGuest && (
          <button
            onClick={() => setImportOpen(true)}
            title="Import voter list"
            className="p-1.5 border-2 border-black rounded-lg bg-white flex-shrink-0"
          >
            <Upload size={18} strokeWidth={2.5} />
          </button>
        )}
        {!isGuest && (
          <button
            onClick={() => setConfirmDelete({ type: "canvass", id: canvassId, label: canvass.name })}
            title="Delete canvass"
            className="p-1.5 border-2 border-black rounded-lg bg-white flex-shrink-0"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        )}
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

      <div className="flex border-2 border-black rounded-lg overflow-hidden mx-4 mb-3 text-xs font-bold">
        <button
          onClick={() => setViewMode("list")}
          className={"flex-1 py-2 " + (viewMode === "list" ? "bg-black text-white" : "bg-white")}
        >
          LIST
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={
            "flex-1 py-2 border-l-2 border-black flex items-center justify-center gap-1.5 " +
            (viewMode === "map" ? "bg-black text-white" : "bg-white")
          }
        >
          <MapIcon size={13} strokeWidth={2.5} /> MAP
        </button>
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
        {viewMode === "list" ? (
          <StreetNav
            streets={streets}
            activeStreetId={activeStreetId}
            onSelect={setActiveStreetId}
            onAdd={handleAddStreet}
            onRename={(id, name) => renameStreet(campaignId, canvassId, id, name).catch(() => flashError("Couldn't rename street."))}
            onDeleteRequest={(s) => setConfirmDelete({ type: "street", id: s.id, label: s.name })}
            canDelete={!isGuest}
          />
        ) : (
          <StreetNav
            streets={streets}
            activeStreetId={mapStreetId}
            onSelect={setMapStreetId}
            onAdd={handleAddStreet}
            onRename={(id, name) => renameStreet(campaignId, canvassId, id, name).catch(() => flashError("Couldn't rename street."))}
            onDeleteRequest={(s) => setConfirmDelete({ type: "street", id: s.id, label: s.name })}
            canDelete={!isGuest}
            allowAll
          />
        )}

        {viewMode === "list" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 pt-3">
              <HouseList
                street={activeStreet}
                houses={activeHouses}
                expandedHouseId={expandedHouseId}
                onToggleExpand={(id) => setExpandedHouseId((cur) => (cur === id ? null : id))}
                onStatusChange={(id, status) => updateActiveHouse(id, { status })}
                onLawnSignToggle={handleLawnSignToggle}
                onRevisitToggle={handleRevisitToggle}
                onNumberChange={(id, number) => updateActiveHouse(id, { number })}
                onFloorChange={(id, floor) => updateActiveHouse(id, { floor })}
                onNotesChange={(id, notes) => updateActiveHouse(id, { notes })}
                onDelete={(id) => {
                  const h = activeHouses.find((x) => x.id === id);
                  const label = activeStreet?.type === "condo" ? `unit ${h?.number ?? ""}` : `house ${h?.number ?? ""}`;
                  setConfirmDelete({ type: "house", id, label });
                }}
                canDelete={!isGuest}
              />
            </div>
            {activeStreet && <AddHouseBar onAdd={handleAddHouses} isCondo={activeStreet.type === "condo"} />}
          </div>
        ) : loadingMapHouses ? (
          <LoadingScreen />
        ) : (
          <MapView
            houses={mapHouses}
            streets={streets}
            overlays={overlays}
            onUploadOverlay={isGuest ? undefined : handleUploadOverlay}
            onDeleteOverlay={isGuest ? undefined : handleDeleteOverlay}
            canManageOverlays={!isGuest}
          />
        )}
      </div>

      {confirmDelete && (
        <ConfirmDeleteModal target={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={confirmDeleteNow} />
      )}
      {importOpen && (
        <ImportCSVModal streets={streets} onCancel={() => setImportOpen(false)} onImport={handleImportVoterList} />
      )}
      <Toast message={error} />
    </div>
  );
}
