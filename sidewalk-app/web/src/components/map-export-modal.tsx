"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { downloadBlob, projectDots, rasterizeSvg, safeMapFileName, type DotMapRect } from "@/lib/dot-map";
import { FILTER_KEYS, GOTV_FILTER_KEYS, filterColor, filterKeyForHouse, filterLabel, type FilterKey } from "@/lib/house-filters";
import type { House } from "@/lib/types";

const WIDTH = 900;
const HEIGHT = 650;
const MAP_RECT: DotMapRect = { x: 50, y: 78, width: WIDTH - 100, height: 420 };
const LEGEND_Y = MAP_RECT.y + MAP_RECT.height + 40;
const EXPORT_SCALE = 3; // rendered at 3x the viewBox size for a crisp, print-quality PNG/PDF

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

// A static, no-basemap "dot map" — the live Leaflet map can't be exported
// (see dot-map.ts's header comment), so this redraws the same colored dots
// at the houses' real relative positions on a plain background instead.
// The <svg> below is both the on-screen preview and the literal thing that
// gets rasterized for download — one source of truth, not a second copy
// built just for export.
export function MapExportModal({
  houses,
  gotv,
  title,
  subtitle,
  onClose,
}: {
  houses: House[];
  gotv: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");

  const keys = gotv ? GOTV_FILTER_KEYS : FILTER_KEYS;
  // Counts reflect only the geocoded houses that actually get a dot —
  // matching the number against "Unlogged" (etc.) in the legend needs to
  // equal what's visibly on the map, not the full (pre-geocode) house list.
  const geocodedHouses = useMemo(() => houses.filter((h) => h.lat != null && h.lng != null), [houses]);
  const { points, skipped } = useMemo(
    () => projectDots(houses, (h) => filterColor(filterKeyForHouse(h, gotv), gotv), MAP_RECT),
    [houses, gotv]
  );
  const counts = useMemo(
    () =>
      keys.reduce(
        (acc, key) => {
          acc[key] = geocodedHouses.filter((h) => filterKeyForHouse(h, gotv) === key).length;
          return acc;
        },
        {} as Record<FilterKey, number>
      ),
    [geocodedHouses, gotv, keys]
  );
  const legendItemWidth = MAP_RECT.width / keys.length;
  const dateLabel = DATE_FORMAT.format(new Date());
  const fileBase = `${safeMapFileName(title)}-map`;

  const handleDownloadPng = async () => {
    if (!svgRef.current || exportingPng) return;
    setExportingPng(true);
    setError("");
    try {
      const { blob } = await rasterizeSvg(svgRef.current, EXPORT_SCALE);
      downloadBlob(blob, `${fileBase}.png`);
    } catch {
      setError("Couldn't generate the image. Try again.");
    } finally {
      setExportingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!svgRef.current || exportingPdf) return;
    setExportingPdf(true);
    setError("");
    try {
      const { dataUrl, width, height } = await rasterizeSvg(svgRef.current, EXPORT_SCALE);
      const { jsPDF } = await import("jspdf");
      // compress: true — without it jsPDF embeds the raster image essentially
      // uncompressed, turning a ~200KB PNG into a 15MB+ PDF for this same map.
      const pdf = new jsPDF({
        orientation: width >= height ? "landscape" : "portrait",
        unit: "pt",
        format: [width, height],
        compress: true,
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`${fileBase}.pdf`);
    } catch {
      setError("Couldn't generate the PDF. Try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    // z-[2000]: same reasoning as every other modal opened over the map tab
    // (ConfirmDeleteModal, HouseHistoryModal) — must beat Leaflet's own
    // panes/controls, which use z-index up to ~1000.
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-[2000]">
      <div className="bg-white border-2 border-black rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-base">Export map</div>
          <button onClick={onClose} className="text-gray-400">
            <X size={18} />
          </button>
        </div>

        {points.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-10 leading-relaxed">
            No pinned houses to show yet — houses get geocoded automatically a few seconds after they&rsquo;re added.
          </div>
        ) : (
          <>
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
              <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" style={{ display: "block", background: "#fff" }}>
                <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#fff" />
                <text
                  x={WIDTH / 2}
                  y={34}
                  textAnchor="middle"
                  fontFamily="'Helvetica Neue',Helvetica,Arial,sans-serif"
                  fontWeight={800}
                  fontSize={22}
                  fill="#000"
                >
                  {title}
                </text>
                {subtitle && (
                  <text
                    x={WIDTH / 2}
                    y={56}
                    textAnchor="middle"
                    fontFamily="'Helvetica Neue',Helvetica,Arial,sans-serif"
                    fontSize={13}
                    fill="#6B7280"
                  >
                    {subtitle}
                  </text>
                )}

                <rect
                  x={MAP_RECT.x}
                  y={MAP_RECT.y}
                  width={MAP_RECT.width}
                  height={MAP_RECT.height}
                  fill="#FAFAFA"
                  stroke="#000"
                  strokeWidth={2}
                  rx={12}
                />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={5} fill={p.color} stroke="#000" strokeWidth={1} />
                ))}

                {keys.map((key, i) => {
                  const lx = MAP_RECT.x + i * legendItemWidth + 14;
                  return (
                    <g key={key}>
                      <circle cx={lx} cy={LEGEND_Y} r={6} fill={filterColor(key, gotv)} stroke="#000" strokeWidth={1} />
                      <text
                        x={lx + 14}
                        y={LEGEND_Y + 4}
                        fontFamily="'Helvetica Neue',Helvetica,Arial,sans-serif"
                        fontWeight={700}
                        fontSize={13}
                        fill="#000"
                      >
                        {filterLabel(key, gotv)} — {counts[key] ?? 0}
                      </text>
                    </g>
                  );
                })}

                <text
                  x={WIDTH - 20}
                  y={HEIGHT - 14}
                  textAnchor="end"
                  fontFamily="'Helvetica Neue',Helvetica,Arial,sans-serif"
                  fontSize={10}
                  fill="#9CA3AF"
                >
                  Generated by Sidewalk · {dateLabel}
                </text>
              </svg>
            </div>

            {skipped > 0 && (
              <div className="text-xs text-gray-400 mb-3 leading-relaxed">
                {skipped} house{skipped === 1 ? " isn't" : "s aren't"} pinned yet and won&rsquo;t appear on this map.
              </div>
            )}
            {error && <div className="text-xs text-red-600 mb-3">{error}</div>}

            <div className="flex gap-2">
              <button
                onClick={handleDownloadPng}
                disabled={exportingPng || exportingPdf}
                className="flex-1 bg-black text-white rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
              >
                {exportingPng ? "GENERATING…" : "DOWNLOAD PNG"}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={exportingPng || exportingPdf}
                className="flex-1 border-2 border-black rounded-lg py-2.5 font-bold text-sm disabled:opacity-40"
              >
                {exportingPdf ? "GENERATING…" : "DOWNLOAD PDF"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
