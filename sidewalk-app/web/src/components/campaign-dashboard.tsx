"use client";

import { useEffect, useState } from "react";
import { RotateCcw, ShieldAlert, Target, TrendingUp, Trophy } from "lucide-react";
import { StatsBar } from "@/components/stats-bar";
import { fetchCampaignEvents, fetchCampaignHouses, fetchCampaignStreets } from "@/lib/canvass-data";
import {
  avoidAreas,
  doorsPerDay,
  doorsToRepeat,
  gotvPriorityAreas,
  supportClusters,
  volunteerLeaderboard,
  type DayCount,
  type RepeatDoor,
  type TargetArea,
  type VolunteerStat,
} from "@/lib/targeting";
import type { Canvass, House, HouseEvent, Street } from "@/lib/types";

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-black rounded-xl p-3.5 bg-white">
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

function TrendChart({ data }: { data: DayCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex items-end gap-1 h-16 mb-1.5">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.date}: ${d.count} doors`}>
            <div
              className="w-full bg-black rounded-sm"
              style={{ height: `${Math.max(2, (d.count / max) * 100)}%`, opacity: d.count === 0 ? 0.1 : 1 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function Leaderboard({ stats }: { stats: VolunteerStat[] }) {
  if (stats.length === 0) {
    return <div className="text-xs text-gray-400 text-center py-3">No activity logged yet.</div>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {stats.map((s, i) => (
        <div key={`${s.actorName}-${i}`} className="flex items-center gap-2 text-sm">
          <span className="w-5 h-5 flex-shrink-0 rounded-full bg-black text-white text-[10px] font-extrabold flex items-center justify-center">
            {i + 1}
          </span>
          <span className="font-semibold truncate flex-1 min-w-0">{s.actorName}</span>
          <span className="text-gray-500 text-xs flex-shrink-0">
            {s.doorCount} door{s.doorCount === 1 ? "" : "s"}
          </span>
        </div>
      ))}
    </div>
  );
}

function AreaList({ areas, emptyText }: { areas: TargetArea[]; emptyText: string }) {
  if (areas.length === 0) {
    return <div className="text-xs text-gray-400 text-center py-3">{emptyText}</div>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {areas.map((a, i) => (
        <div key={i} className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold truncate">{a.label}</span>
          <span className="text-gray-500 text-xs flex-shrink-0">
            {a.count} door{a.count === 1 ? "" : "s"}
          </span>
        </div>
      ))}
    </div>
  );
}

function RepeatList({ doors }: { doors: RepeatDoor[] }) {
  if (doors.length === 0) {
    return <div className="text-xs text-gray-400 text-center py-3">Nothing waiting on a repeat visit.</div>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {doors.slice(0, 8).map((d) => (
        <div key={d.house.id} className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold truncate">
            {d.house.number} {d.streetName}
          </span>
          <span className="text-gray-500 text-xs flex-shrink-0">
            {d.daysSinceTouch == null ? "never attempted" : `${d.daysSinceTouch}d ago`}
          </span>
        </div>
      ))}
    </div>
  );
}

// Campaign-wide intelligence: the existing status rollup, plus everything
// that became possible once houses started carrying real history (see
// lib/targeting.ts) — an activity trend, a volunteer leaderboard, and
// four targeting panels telling a campaign where to actually spend its
// limited canvassing hours. All derived at read time from data that
// already exists; nothing here is a new Firestore write.
export function CampaignDashboard({
  campaignId,
  canvasses,
  campaignName,
}: {
  campaignId: string;
  canvasses: Canvass[];
  campaignName: string;
}) {
  const [houses, setHouses] = useState<House[] | null>(null);
  const [streets, setStreets] = useState<Street[]>([]);
  const [events, setEvents] = useState<HouseEvent[] | null>(null);
  const [eventsUnavailable, setEventsUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  // Keyed on the set of canvass IDs (not the `canvasses` array itself,
  // whose reference changes on every doorCount/streetCount write) so this
  // doesn't re-fetch the whole campaign on every unrelated edit — same
  // tradeoff the old per-campaign stats panel already made.
  const canvassIdsKey = canvasses
    .map((c) => c.id)
    .sort()
    .join(",");

  useEffect(() => {
    let cancelled = false;
    const ids = canvassIdsKey ? canvassIdsKey.split(",") : [];
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      setEventsUnavailable(false);
      try {
        const [h, s, e] = await Promise.all([
          fetchCampaignHouses(campaignId, ids),
          fetchCampaignStreets(campaignId, ids),
          // Most likely failure here: the composite collection-group
          // index this query needs (see firestore.indexes.json) hasn't
          // been deployed to this Firebase project yet. Fail soft — the
          // rest of the dashboard doesn't depend on events, so it still
          // renders.
          fetchCampaignEvents(campaignId).catch(() => {
            if (!cancelled) setEventsUnavailable(true);
            return [] as HouseEvent[];
          }),
        ]);
        if (cancelled) return;
        setHouses(h);
        setStreets(s);
        setEvents(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, canvassIdsKey]);

  if (loading || houses === null) {
    return <div className="text-xs text-gray-400 text-center py-6">Loading…</div>;
  }

  const streetTotal = canvasses.reduce((sum, c) => sum + c.streetCount, 0);
  const trend = events ? doorsPerDay(events) : [];
  const leaderboard = events ? volunteerLeaderboard(events) : [];
  const gotv = gotvPriorityAreas(houses, streets);
  const repeats = doorsToRepeat(houses, streets);
  const support = supportClusters(houses, streets);
  const avoid = avoidAreas(houses, streets);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-xs text-gray-500 mb-2">
          {streetTotal} street{streetTotal === 1 ? "" : "s"}
        </div>
        <StatsBar houses={houses} label={campaignName} />
      </div>

      {eventsUnavailable ? (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          Activity trend and the volunteer leaderboard aren&rsquo;t available yet — this needs a Firestore index
          that hasn&rsquo;t been deployed. Everything below still works.
        </div>
      ) : (
        <>
          <Card icon={<TrendingUp size={14} strokeWidth={2.5} />} title={`Activity, last ${trend.length} days`}>
            <TrendChart data={trend} />
          </Card>
          <Card icon={<Trophy size={14} strokeWidth={2.5} />} title="Top volunteers">
            <Leaderboard stats={leaderboard} />
          </Card>
        </>
      )}

      <Card icon={<Target size={14} strokeWidth={2.5} />} title="GOTV priority — densest uncontacted supporters">
        <AreaList areas={gotv} emptyText="No uncontacted supporters pending in a GOTV canvass." />
      </Card>
      <Card icon={<RotateCcw size={14} strokeWidth={2.5} />} title="Doors to repeat">
        <RepeatList doors={repeats} />
      </Card>
      <Card icon={<Target size={14} strokeWidth={2.5} />} title="Support clusters">
        <AreaList areas={support} emptyText="No supporters logged yet." />
      </Card>
      <Card icon={<ShieldAlert size={14} strokeWidth={2.5} />} title="Lower-priority areas">
        <AreaList areas={avoid} emptyText="No opposition clusters logged yet." />
      </Card>
    </div>
  );
}
