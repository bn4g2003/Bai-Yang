"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_SERIES, CHART_TOOLTIP_FLOAT } from "@/lib/chart-colors";

type LogLike = {
  log_date: string;
  do_mg_l: number | null;
  ph: number | null;
};

function aggregateByDay(rows: LogLike[]) {
  const map = new Map<string, { do: number[]; ph: number[] }>();
  for (const r of rows) {
    const d = r.log_date;
    if (!d) continue;
    let cur = map.get(d);
    if (!cur) {
      cur = { do: [], ph: [] };
      map.set(d, cur);
    }
    if (r.do_mg_l != null) cur.do.push(r.do_mg_l);
    if (r.ph != null) cur.ph.push(r.ph);
  }
  const sorted = [...map.keys()].sort((a, b) => a.localeCompare(b));
  return sorted.map((day) => {
    const v = map.get(day)!;
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
    return {
      day,
      short: day.slice(5),
      do: avg(v.do),
      ph: avg(v.ph),
    };
  });
}

export function EnvMetricsTrendChart({ rows }: { rows: LogLike[] }) {
  const data = useMemo(() => {
    const agg = aggregateByDay(rows);
    return agg.slice(-24);
  }, [rows]);

  if (data.length < 2) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Xu hướng theo ngày (trung bình các lần ghi)
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        Tối đa 24 ngày gần nhất có dữ liệu trong tập đang tải.
      </p>
      <div className="mt-3 h-64 w-full text-zinc-500 dark:text-zinc-400">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="short" tick={CHART_AXIS.tick} axisLine={{ stroke: CHART_AXIS.stroke }} tickLine={false} />
            <YAxis
              yAxisId="do"
              tick={CHART_AXIS.tick}
              axisLine={false}
              tickLine={false}
              width={36}
              domain={["auto", "auto"]}
              label={{ value: "DO", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "currentColor" } }}
            />
            <YAxis
              yAxisId="ph"
              orientation="right"
              tick={CHART_AXIS.tick}
              axisLine={false}
              tickLine={false}
              width={32}
              domain={["auto", "auto"]}
              label={{ value: "pH", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "currentColor" } }}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_FLOAT}
              labelFormatter={(label, payload) => {
                const p = payload?.[0]?.payload as { day?: string };
                return p?.day ?? String(label);
              }}
              formatter={(value, name) => {
                const label = String(name ?? "");
                if (value == null || value === "") return ["—", label];
                const n = Number(value);
                if (Number.isNaN(n)) return ["—", label];
                return [n.toFixed(2), label];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="do"
              type="monotone"
              dataKey="do"
              name="DO (mg/L)"
              stroke={CHART_SERIES[0]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              yAxisId="ph"
              type="monotone"
              dataKey="ph"
              name="pH"
              stroke={CHART_SERIES[2]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
