import { STATUS_COLORS, STATUS_LABEL, STATUS_ORDER } from "@/components/status-icons";
import type { House } from "@/lib/types";

function computeStats(houses: House[]) {
  const counts: Record<string, number> = { support: 0, undecided: 0, against: 0, not_home: 0 };
  let lawnSign = 0;
  let revisit = 0;
  houses.forEach((h) => {
    if (h.status && h.status in counts) counts[h.status]++;
    if (h.lawnSign) lawnSign++;
    if (h.revisit) revisit++;
  });
  const total = houses.length;
  const logged = STATUS_ORDER.reduce((sum, k) => sum + counts[k], 0);
  return { total, logged, counts, lawnSign, revisit };
}

export function StatsBar({ houses, label }: { houses: House[]; label: string }) {
  const { total, counts, lawnSign, revisit } = computeStats(houses);
  if (total === 0) {
    return <div className="text-xs text-gray-400 text-center py-4">No houses logged here yet.</div>;
  }
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold uppercase tracking-wide">{label}</div>
        <div className="text-xs text-gray-500">{total} doors</div>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 border border-gray-200">
        {STATUS_ORDER.map(
          (key) =>
            counts[key] > 0 && (
              <div key={key} style={{ width: `${pct(counts[key])}%`, background: STATUS_COLORS[key] }} />
            )
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {STATUS_ORDER.map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[key] }} />
            <span className="font-bold">{counts[key]}</span>
            <span className="text-gray-500">
              {STATUS_LABEL[key]} ({pct(counts[key])}%)
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 border-black bg-white" />
          <span className="font-bold">{lawnSign}</span>
          <span className="text-gray-500">Lawn signs ({pct(lawnSign)}%)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-black" />
          <span className="font-bold">{revisit}</span>
          <span className="text-gray-500">Follow-ups ({pct(revisit)}%)</span>
        </div>
      </div>
    </div>
  );
}
