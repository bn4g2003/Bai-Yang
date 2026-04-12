"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PondRow } from "@/lib/types/pond";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_FLOAT } from "@/lib/chart-colors";

function deltaDays(p: PondRow): number | null {
  if (!p.planned_harvest_date || !p.adjusted_harvest_date) return null;
  const planned = new Date(p.planned_harvest_date).getTime();
  const adj = new Date(p.adjusted_harvest_date).getTime();
  return Math.round((adj - planned) / (1000 * 60 * 60 * 24));
}

const POS = "#059669";
const NEG = "#dc2626";
const ZERO = "#71717a";

export function DashboardThdcDeltaChart({ ponds, maxItems = 14 }: { ponds: PondRow[]; maxItems?: number }) {
  const data = ponds
    .map((p) => {
      const d = deltaDays(p);
      if (d === null) return null;
      return { pond: p.pond_code, delta: d };
    })
    .filter((x): x is { pond: string; delta: number } => x != null)
    .slice(0, maxItems);

  if (data.length === 0) return null;

  return (
    <div className="h-[min(28rem,70vh)] w-full min-h-48 text-zinc-500 dark:text-zinc-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis
            type="number"
            tick={CHART_AXIS.tick}
            axisLine={{ stroke: CHART_AXIS.stroke }}
            tickLine={false}
            tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v}`}
          />
          <YAxis
            type="category"
            dataKey="pond"
            width={56}
            tick={CHART_AXIS.tick}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_FLOAT}
            formatter={(value) => {
              const v = typeof value === "number" ? value : Number(value);
              if (Number.isNaN(v)) return ["—", "Lệch thu hoạch"];
              return [`${v >= 0 ? "+" : ""}${v} ngày so với ngày gốc`, "Lệch thu hoạch"];
            }}
          />
          <Bar dataKey="delta" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry) => (
              <Cell
                key={entry.pond}
                fill={entry.delta > 0 ? POS : entry.delta < 0 ? NEG : ZERO}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
