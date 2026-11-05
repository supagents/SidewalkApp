// Geometry + rasterization for the static "dot map" export (see
// map-export-modal.tsx). Deliberately not the live Leaflet map: OSM's tile
// server doesn't send CORS headers, so any canvas that's painted a raster
// tile onto it becomes "tainted" and can never be read back out as an
// image — there's no reliable way to screenshot the real map in-browser.
// This draws only shapes we authored ourselves (no external images), which
// keeps the canvas readable and the export reliable every time.
import type { House } from "@/lib/types";

export type DotMapPoint = { x: number; y: number; color: string };
export type DotMapRect = { x: number; y: number; width: number; height: number };

// A single house (or a tight cluster at one address) shouldn't collapse a
// whole bounding box to a point — floor is ~150m, small enough to still
// look "zoomed in" rather than artificially spread out.
const MIN_SPAN_DEGREES = 0.0015;

// Equirectangular projection: a degree of longitude covers less real-world
// distance than a degree of latitude the further you are from the equator,
// so longitude is scaled by cos(latitude) to keep the dot pattern's shape
// proportional to the real layout of the houses, not stretched east-west.
// Same "good enough, not globally precise" tradeoff this codebase already
// makes for routing (lib/route.ts) and clustering (lib/targeting.ts) — a
// canvassing dot map doesn't need surveying-grade accuracy.
export function projectDots(houses: House[], colorFor: (house: House) => string, rect: DotMapRect, innerPadding = 20) {
  const geocoded = houses.filter((h): h is House & { lat: number; lng: number } => h.lat != null && h.lng != null);
  const skipped = houses.length - geocoded.length;
  if (geocoded.length === 0) return { points: [] as DotMapPoint[], skipped };

  const lats = geocoded.map((h) => h.lat);
  const lngs = geocoded.map((h) => h.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const avgLat = (minLat + maxLat) / 2;
  const lngCos = Math.cos((avgLat * Math.PI) / 180);

  const spanLat = Math.max(maxLat - minLat, MIN_SPAN_DEGREES);
  const spanLng = Math.max((maxLng - minLng) * lngCos, MIN_SPAN_DEGREES * lngCos);

  const innerW = rect.width - innerPadding * 2;
  const innerH = rect.height - innerPadding * 2;
  const scale = Math.min(innerW / spanLng, innerH / spanLat);

  const usedW = spanLng * scale;
  const usedH = spanLat * scale;
  const offsetX = rect.x + innerPadding + (innerW - usedW) / 2;
  const offsetY = rect.y + innerPadding + (innerH - usedH) / 2;

  const points = geocoded.map((h) => ({
    x: offsetX + (h.lng - minLng) * lngCos * scale,
    y: offsetY + (maxLat - h.lat) * scale,
    color: colorFor(h),
  }));

  return { points, skipped };
}

// Serializes a live SVG node (the exact same markup the modal previews) to
// a PNG — drawn at `scale`x the viewBox size for a crisp export instead of
// a blurry one-to-one screen-resolution capture.
export async function rasterizeSvg(svg: SVGSVGElement, scale: number) {
  const vb = svg.viewBox.baseVal;
  const width = vb && vb.width ? vb.width : svg.clientWidth;
  const height = vb && vb.height ? vb.height : svg.clientHeight;

  const svgString = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't rasterize the map."));
    });
    img.src = url;
    await loaded;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't generate the image."))), "image/png")
    );
    return { blob, dataUrl: canvas.toDataURL("image/png"), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function safeMapFileName(name: string) {
  return (name || "sidewalk").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "sidewalk";
}
