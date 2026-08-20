"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { STATUS_COLORS } from "@/components/status-icons";
import type { House } from "@/lib/types";

const NO_STATUS_COLOR = "#D1D5DB"; // matches the pale gray "unlogged" face outline elsewhere in the app

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

export function MapView({ houses }: { houses: House[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

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
      map.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    const pinned = houses.filter((h) => h.lat != null && h.lng != null);
    const markers = pinned.map((h) => {
      const color = h.status ? STATUS_COLORS[h.status] : NO_STATUS_COLOR;
      return L.marker([h.lat as number, h.lng as number], { icon: pinIcon(color) }).bindPopup(
        `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;">${h.address || h.number}</div>`
      );
    });
    clusterGroup.addLayers(markers);

    if (markers.length > 0) {
      const bounds = L.featureGroup(markers).getBounds();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    }
  }, [houses]);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={containerRef} className="absolute inset-0" />
      {houses.filter((h) => h.lat != null && h.lng != null).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
          <div className="bg-white border-2 border-black rounded-xl px-4 py-3 text-sm text-gray-500 text-center leading-relaxed shadow-sm">
            No pins yet — houses get geocoded automatically a few seconds after they&apos;re added.
          </div>
        </div>
      )}
    </div>
  );
}
