"use client";

import { useMemo, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { FaceIcon, NotHomeIcon } from "@/components/status-icons";
import { nearestNeighborRoute, type LatLng } from "@/lib/route";
import type { House, HouseStatus, Street } from "@/lib/types";

type StartPoint = { label: string; at: LatLng };

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function LocateControl({
  onLocated,
  onPickHouse,
  houseOptions,
}: {
  onLocated: (p: StartPoint) => void;
  onPickHouse: (houseId: string) => void;
  houseOptions: { id: string; label: string }[];
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser can't share your location.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onLocated({ label: "your current location", at: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location — check your browser's location permission, or pick a starting house below.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
      <div className="text-sm font-bold mb-1">Where are you starting?</div>
      <div className="text-xs text-gray-500 mb-4 leading-relaxed">
        The whole canvass gets ordered into one walk list, closest-next, starting from here.
      </div>
      <button
        onClick={useMyLocation}
        disabled={locating}
        className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
      >
        <Crosshair size={16} strokeWidth={2.5} /> {locating ? "Finding you…" : "USE MY LOCATION"}
      </button>
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      {houseOptions.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-1.5">or start from a specific house</div>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && onPickHouse(e.target.value)}
            className="w-full border-2 border-black rounded-lg px-2.5 py-2 text-sm outline-none bg-white"
          >
            <option value="" disabled>
              Choose a house…
            </option>
            {houseOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function RouteRow({
  index,
  house,
  streetName,
  distanceMeters,
  onStatusChange,
}: {
  index: number;
  house: House;
  streetName: string;
  distanceMeters: number;
  onStatusChange: (status: HouseStatus | null) => void;
}) {
  const visited = house.status != null;
  return (
    <div className={"bg-white border-2 border-black rounded-xl px-3 py-2.5 flex items-center gap-2.5 " + (visited ? "opacity-50" : "")}>
      <div className="w-7 h-7 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center font-extrabold text-xs">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm truncate">
          {house.number} {streetName}
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <MapPin size={10} strokeWidth={2.5} /> {formatDistance(distanceMeters)} from last stop
        </div>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={() => onStatusChange(house.status === "support" ? null : "support")}>
          <FaceIcon type="support" active={house.status === "support"} size={22} />
        </button>
        <button onClick={() => onStatusChange(house.status === "undecided" ? null : "undecided")}>
          <FaceIcon type="undecided" active={house.status === "undecided"} size={22} />
        </button>
        <button onClick={() => onStatusChange(house.status === "against" ? null : "against")}>
          <FaceIcon type="against" active={house.status === "against"} size={22} />
        </button>
        <button onClick={() => onStatusChange(house.status === "not_home" ? null : "not_home")} title="Not home">
          <NotHomeIcon active={house.status === "not_home"} size={22} />
        </button>
      </div>
    </div>
  );
}

export function GotvChecklist({
  houses,
  streets,
  loading,
  onStatusChange,
}: {
  houses: House[];
  streets: Street[];
  loading: boolean;
  onStatusChange: (house: House, status: HouseStatus | null) => void;
}) {
  const [start, setStart] = useState<StartPoint | null>(null);

  const streetById = useMemo(() => new Map(streets.map((s) => [s.id, s])), [streets]);
  const geocoded = useMemo(() => houses.filter((h) => h.lat != null && h.lng != null), [houses]);
  const ungeocoded = houses.length - geocoded.length;

  const houseOptions = useMemo(
    () =>
      geocoded
        .map((h) => ({ id: h.id, label: `${h.number} ${streetById.get(h.streetId)?.name ?? ""}`.trim() }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [geocoded, streetById]
  );

  const route = useMemo(() => {
    if (!start) return [];
    return nearestNeighborRoute(
      start.at,
      geocoded.map((h) => ({ item: h, at: { lat: h.lat as number, lng: h.lng as number } }))
    );
  }, [start, geocoded]);

  const pickHouse = (houseId: string) => {
    const h = geocoded.find((x) => x.id === houseId);
    if (!h) return;
    setStart({
      label: `${h.number} ${streetById.get(h.streetId)?.name ?? ""}`.trim(),
      at: { lat: h.lat as number, lng: h.lng as number },
    });
  };

  if (loading) {
    return <div className="text-sm text-gray-400 text-center py-10">Loading…</div>;
  }

  if (geocoded.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-10 leading-relaxed px-6">
        No geocoded houses yet — add streets and houses on the LIST tab first, then come back here
        to route them.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 md:px-6 py-3 overflow-y-auto flex-1 min-h-0">
      {!start ? (
        <LocateControl onLocated={setStart} onPickHouse={pickHouse} houseOptions={houseOptions} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-xs text-gray-500 px-0.5">
            <span>
              Starting from <span className="font-semibold text-black">{start.label}</span> ·{" "}
              {route.length} stop{route.length === 1 ? "" : "s"}
            </span>
            <button onClick={() => setStart(null)} className="font-bold underline underline-offset-2 flex-shrink-0">
              Change start
            </button>
          </div>
          {ungeocoded > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {ungeocoded} house{ungeocoded === 1 ? "" : "s"} can&apos;t be routed yet — still waiting on an address to
              geocode.
            </div>
          )}
          {route.map((stop, i) => (
            <RouteRow
              key={stop.item.id}
              index={i}
              house={stop.item}
              streetName={streetById.get(stop.item.streetId)?.name ?? ""}
              distanceMeters={stop.distanceFromPreviousMeters}
              onStatusChange={(status) => onStatusChange(stop.item, status)}
            />
          ))}
        </>
      )}
    </div>
  );
}
