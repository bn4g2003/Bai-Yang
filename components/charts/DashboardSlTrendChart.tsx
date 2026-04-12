"use client";

import {
  Area,
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

export type SlTrendPoint = {
  day: string;
  total_feed_kg: number;
  total_dead_loss: number;
};

export function DashboardSlTrendChart({ data }: { data: SlTrendPoint[] }) {
  if (data.length === 0) return null;
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.day + "T12:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "short" }),
  }));

  return (
    <div className="h-56 w-full text-zinc-500 dark:text-zinc-400">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="label" tick={CHART_AXIS.tick} axisLine={{ stroke: CHART_AXIS.stroke }} tickLine={false} />
          <YAxis
            yAxisId="left"
            tick={CHART_AXIS.tick}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={CHART_AXIS.tick}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_FLOAT}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as SlTrendPoint & { label: string };
              return p?.day ?? "";
            }}
            formatter={(value, name) => {
              const v = value as number | undefined;
              const n = String(name ?? "");
              if (n === "Thức ăn (kg)") return [v != null ? Number(v).toLocaleString("vi-VN") : "—", n];
              if (n === "Hao hụt (con)") return [v != null ? Number(v).toLocaleString("vi-VN") : "—", n];
              return [value ?? "—", n];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="total_feed_kg"
            name="Thức ăn (kg)"
            stroke={CHART_SERIES[0]}
            fill={CHART_SERIES[0]}
            fillOpacity={0.12}
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="total_dead_loss"
            name="Hao hụt (con)"
            stroke={CHART_SERIES[1]}
            strokeWidth={2}
            dot={{ r: 2, fill: CHART_SERIES[1] }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
