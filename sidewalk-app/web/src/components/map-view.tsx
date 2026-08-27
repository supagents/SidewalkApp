"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Layers, Plus, Trash2 } from "lucide-react";
import { STATUS_COLORS, STATUS_LABEL, STATUS_ORDER } from "@/components/status-icons";
import { UploadOverlayModal } from "@/components/upload-overlay-modal";
import type { MapOverlay } from "@/lib/map-overlays";
import type { House, HouseStatus } from "@/lib/types";

const NO_STATUS_COLOR = "#D1D5DB"; // matches the pale gray "unlogged" face outline elsewhere in the app
const UNLOGGED = "unlogged";
type FilterKey = HouseStatus | typeof UNLOGGED;
const FILTER_KEYS: FilterKey[] = [...STATUS_ORDER, UNLOGGED];

function filterColor(key: FilterKey) {
  return key === UNLOGGED ? NO_STATUS_COLOR : STATUS_COLORS[key];
}
function filterLabel(key: FilterKey) {
  return key === UNLOGGED ? "Unlogged" : STATUS_LABEL[key];
}

function MapFilterBar({
  counts,
  hidden,
  onToggle,
}: {
  counts: Record<FilterKey, number>;
  hidden: Set<FilterKey>;
  onToggle: (key: FilterKey) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto whitespace-nowrap border-b border-gray-200 bg-white flex-shrink-0">
      {FILTER_KEYS.map((key) => {
        const active = !hidden.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold " +
              (active ? "border-black bg-white text-black" : "border-gray-300 bg-gray-50 text-gray-400")
            }
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-black flex-shrink-0"
              style={{ background: active ? filterColor(key) : "#E5E7EB", borderColor: active ? "#000" : "#D1D5DB" }}
            />
            {filterLabel(key)}
            <span className={active ? "text-gray-500" : "text-gray-300"}>{counts[key] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function LayersPanel({
  overlays,
  hiddenIds,
  onToggle,
  onDelete,
  onAddClick,
  canManage,
  onClose,
}: {
  overlays: MapOverlay[];
  hiddenIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
  canManage: boolean;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-3 top-3 z-[500] w-64 bg-white border-2 border-black rounded-xl overflow-hidden shadow-sm">
      <div className="px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide">Layers</span>
        <button onClick={onClose} className="text-gray-400 text-xs font-semibold">
          Close
        </button>
      </div>
      {overlays.length === 0 ? (
        <div className="px-3.5 py-4 text-xs text-gray-400 text-center leading-relaxed">
          No boundary layers yet — ward, riding, poll, or any other district file.
        </div>
      ) : (
        <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
          {overlays.map((o) => {
            const active = !hiddenIds.has(o.id);
            return (
              <div key={o.id} className="flex items-center gap-2 px-3.5 py-2.5">
                <button onClick={() => onToggle(o.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <span
                    className="w-3 h-3 rounded-sm border border-black flex-shrink-0"
                    style={{ background: active ? o.color : "#E5E7EB", borderColor: active ? "#000" : "#D1D5DB" }}
                  />
                  <span className={"text-sm font-semibold truncate " + (active ? "text-black" : "text-gray-400")}>{o.name}</span>
                </button>
                {canManage && (
                  <button onClick={() => onDelete(o.id)} className="text-gray-300 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {canManage && (
        <button
          onClick={onAddClick}
          className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 border-t border-gray-200 text-sm font-bold"
        >
          <Plus size={14} strokeWidth={3} /> Add layer
        </button>
      )}
    </div>
  );
}

// Leaflet's bindPopup treats a string argument as raw HTML, not text — and
// popup content here (a house address built from a user-editable street
// name, or an overlay's name/label pulled from an uploaded file's
// attribute data) is never something we control. Building a real DOM node
// and setting textContent (rather than interpolating into an HTML string)
// means whatever's in there renders as literal text, never executes.
function popupContent(text: string): HTMLDivElement {
  const div = document.createElement("div");
  div.style.fontFamily = "'Helvetica Neue',Helvetica,Arial,sans-serif";
  div.style.fontWeight = "700";
  div.textContent = text;
  return div;
}

function pinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #000;box-shadow:0 1px 2px rgba(0,0,0,0.35);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${count}</div>`,
    iconSize: [36, 36],
  });
}

export function MapView({
  houses,
  overlays = [],
  onUploadOverlay,
  onDeleteOverlay,
  canManageOverlays = false,
}: {
  houses: House[];
  overlays?: MapOverlay[];
  onUploadOverlay?: (name: string, file: File) => Promise<void>;
  onDeleteOverlay?: (id: string) => void;
  canManageOverlays?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const overlayLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());
  const [hidden, setHidden] = useState<Set<FilterKey>>(new Set());
  const [hiddenOverlayIds, setHiddenOverlayIds] = useState<Set<string>>(new Set());
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const toggleFilter = (key: FilterKey) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleOverlay = (id: string) => {
    setHiddenOverlayIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([39.8283, -98.5795], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    const clusterGroup = L.markerClusterGroup({ iconCreateFunction: clusterIcon });
    clusterGroup.addTo(map);
    mapRef.current = map;
    clusterGroupRef.current = clusterGroup;

    return () => {
      // map.remove() tears down every layer added to it, including the
      // overlay layers below — and this whole component (ref included)
      // unmounts along with it, so there's nothing left to separately clear.
      map.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
    };
  }, []);

  // Boundary layers live directly on the map (not the marker cluster
  // group) since they're polygons, not points — added/removed from a
  // per-overlay-id cache rather than rebuilt every render, so toggling
  // visibility doesn't re-parse the (sometimes sizable) GeoJSON each time.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(overlays.map((o) => o.id));
    overlayLayersRef.current.forEach((layer, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(layer);
        overlayLayersRef.current.delete(id);
      }
    });

    overlays.forEach((o) => {
      let layer = overlayLayersRef.current.get(o.id);
      if (!layer) {
        layer = L.geoJSON(o.geojson, {
          style: { color: o.color, weight: 2, fillColor: o.color, fillOpacity: 0.08 },
          onEachFeature: (feature, l) => {
            const label = feature.properties?.label as string | null | undefined;
            l.bindPopup(popupContent(label || o.name));
          },
        });
        overlayLayersRef.current.set(o.id, layer);
      }
      const shouldShow = !hiddenOverlayIds.has(o.id);
      const isOnMap = map.hasLayer(layer);
      if (shouldShow && !isOnMap) layer.addTo(map);
      if (!shouldShow && isOnMap) map.removeLayer(layer);
    });
  }, [overlays, hiddenOverlayIds]);

  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    const pinned = houses.filter((h) => h.lat != null && h.lng != null && !hidden.has(h.status ?? UNLOGGED));
    const markers = pinned.map((h) => {
      const color = h.status ? STATUS_COLORS[h.status] : NO_STATUS_COLOR;
      return L.marker([h.lat as number, h.lng as number], { icon: pinIcon(color) }).bindPopup(
        popupContent(h.address || h.number)
      );
    });
    clusterGroup.addLayers(markers);

    if (markers.length > 0) {
      const bounds = L.featureGroup(markers).getBounds();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    }
  }, [houses, hidden]);

  const allPinned = houses.filter((h) => h.lat != null && h.lng != null);
  const visiblePinned = allPinned.filter((h) => !hidden.has(h.status ?? UNLOGGED));
  const counts = FILTER_KEYS.reduce((acc, key) => {
    acc[key] = allPinned.filter((h) => (h.status ?? UNLOGGED) === key).length;
    return acc;
  }, {} as Record<FilterKey, number>);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <MapFilterBar counts={counts} hidden={hidden} onToggle={toggleFilter} />
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="absolute inset-0" />
        {visiblePinned.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
            <div className="bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-gray-500 text-center leading-relaxed shadow-sm">
              {allPinned.length === 0
                ? "No pins yet — houses get geocoded automatically a few seconds after they're added."
                : "No pins match the selected filters."}
            </div>
          </div>
        )}

        {layersPanelOpen ? (
          <LayersPanel
            overlays={overlays}
            hiddenIds={hiddenOverlayIds}
            onToggle={toggleOverlay}
            onDelete={(id) => onDeleteOverlay?.(id)}
            onAddClick={() => setUploadModalOpen(true)}
            canManage={canManageOverlays}
            onClose={() => setLayersPanelOpen(false)}
          />
        ) : (
          <button
            onClick={() => setLayersPanelOpen(true)}
            title="Boundary layers"
            className="absolute right-3 top-3 z-[500] w-9 h-9 flex items-center justify-center bg-white border-2 border-black rounded-lg shadow-sm"
          >
            <Layers size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {uploadModalOpen && onUploadOverlay && (
        <UploadOverlayModal
          onCancel={() => setUploadModalOpen(false)}
          onUpload={async (name, file) => {
            await onUploadOverlay(name, file);
            setUploadModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
