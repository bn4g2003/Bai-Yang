"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_SERIES, CHART_TOOLTIP_FLOAT } from "@/lib/chart-colors";

export type PlanByAgentRow = { name: string; code: string; months: number[] };

export function DashboardThkhStackedChart({ planByAgent }: { planByAgent: PlanByAgentRow[] }) {
  if (planByAgent.length === 0) return null;

  const monthLabels = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
  const chartData = monthLabels.map((label, i) => {
    const row: Record<string, string | number> = { month: label };
    for (const a of planByAgent) {
      const key = `a_${a.code}`;
      row[key] = a.months[i] ?? 0;
    }
    return row;
  });

  return (
    <div className="h-72 w-full text-zinc-500 dark:text-zinc-400">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="month" tick={CHART_AXIS.tick} axisLine={{ stroke: CHART_AXIS.stroke }} tickLine={false} />
          <YAxis
            tick={CHART_AXIS.tick}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_FLOAT}
            formatter={(value, name) => {
              const num = typeof value === "number" ? value : Number(value);
              const label = String(name ?? "");
              return [
                !Number.isNaN(num) && num > 0
                  ? `${num.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tấn`
                  : "—",
                label,
              ];
            }}
            labelFormatter={(label) => `Tháng ${String(label)}`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {planByAgent.map((a, idx) => (
            <Bar
              key={a.code}
              dataKey={`a_${a.code}`}
              name={a.name}
              stackId="ton"
              fill={CHART_SERIES[idx % CHART_SERIES.length]}
              radius={idx === planByAgent.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
