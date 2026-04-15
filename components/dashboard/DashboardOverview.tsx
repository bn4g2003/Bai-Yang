"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardSlTrendChart, type SlTrendPoint } from "@/components/charts/DashboardSlTrendChart";
import { DashboardThdcDeltaChart } from "@/components/charts/DashboardThdcDeltaChart";
import { DashboardThkhStackedChart } from "@/components/charts/DashboardThkhStackedChart";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { PondRow } from "@/lib/types/pond";

type SlRow = { day: string; total_feed_kg: number; total_dead_loss: number };
type AlertRow = {
  pond_id: string;
  log_date: string;
  alert_reason: string | null;
};
type PlanRow = {
  year: number;
  month: number;
  planned_tonnage: number;
  agents: { name: string; code: string } | null;
};

type HarvestTimingRow = {
  pond_id: string;
  pond_code: string;
  effective_harvest_date: string;
  days_until_harvest: number;
};

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardOverview() {
  const [sl, setSl] = useState<SlRow | null>(null);
  const [slTrend, setSlTrend] = useState<SlTrendPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [harvestTiming, setHarvestTiming] = useState<HarvestTimingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = new Date().getFullYear();

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    const day = isoToday();
    const [slRes, slTrendRes, alertRes, planRes, pondRes, harvestRes] = await Promise.all([
      supabase.from("v_sl_ngay").select("*").eq("day", day).maybeSingle(),
      supabase
        .from("v_sl_ngay")
        .select("day,total_feed_kg,total_dead_loss")
        .order("day", { ascending: false })
        .limit(14),
      supabase
        .from("v_env_alerts_latest")
        .select("pond_id,log_date,alert_reason")
        .eq("log_date", day)
        .not("alert_reason", "is", null),
      supabase
        .from("monthly_harvest_plans")
        .select("year,month,planned_tonnage,agents(name,code)")
        .eq("year", year)
        .order("month"),
      supabase.from("ponds").select("*"),
      supabase
        .from("v_pond_harvest_timing")
        .select("pond_id,pond_code,effective_harvest_date,days_until_harvest")
        .order("days_until_harvest", { ascending: true })
        .limit(40),
    ]);
    if (slRes.error) setError(slRes.error.message);
    setSl((slRes.data as SlRow | null) ?? null);
    if (slTrendRes.error) {
      setSlTrend([]);
    } else if (slTrendRes.data) {
      const raw = slTrendRes.data as SlTrendPoint[];
      setSlTrend(
        [...raw].reverse().map((r) => ({
          day: r.day,
          total_feed_kg: Number(r.total_feed_kg),
          total_dead_loss: Number(r.total_dead_loss),
        })),
      );
    } else {
      setSlTrend([]);
    }
    if (!alertRes.error && alertRes.data) setAlerts(alertRes.data as AlertRow[]);
    if (!planRes.error && planRes.data) {
      setPlans(
        (planRes.data as { year: number; month: number; planned_tonnage: number; agents: unknown }[]).map(
          (r) => ({
            year: r.year,
            month: r.month,
            planned_tonnage: Number(r.planned_tonnage),
            agents: r.agents as { name: string; code: string } | null,
          }),
        ),
      );
    }
    if (!pondRes.error && pondRes.data) setPonds(pondRes.data as PondRow[]);
    if (!harvestRes.error && harvestRes.data) {
      setHarvestTiming(harvestRes.data as HarvestTimingRow[]);
    } else {
      setHarvestTiming([]);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const thdc = useMemo(() => {
    return ponds.filter((p) => p.planned_harvest_date && p.adjusted_harvest_date);
  }, [ponds]);

  const planByAgent = useMemo(() => {
    const m = new Map<string, { name: string; code: string; months: number[] }>();
    for (const p of plans) {
      const key = p.agents?.code ?? "—";
      const name = p.agents?.name ?? "Chưa gán đại lý";
      if (!m.has(key)) m.set(key, { name, code: key, months: Array(12).fill(0) });
      const row = m.get(key)!;
      row.months[p.month - 1] = p.planned_tonnage;
    }
    return [...m.values()];
  }, [plans]);

  if (!supabaseConfigured()) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">SL ngày</h2>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {loading ? "…" : (sl?.total_feed_kg ?? 0).toLocaleString("vi-VN")}
            <span className="ml-1 text-base font-normal text-zinc-500">kg thức ăn</span>
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Hao hụt trong ngày:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {loading ? "…" : (sl?.total_dead_loss ?? 0).toLocaleString("vi-VN")} con
            </span>
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Theo <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">log_date = hôm nay</code> trên
            nhật ký.
          </p>
          {!loading && slTrend.length > 1 ? (
            <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                14 ngày gần nhất
              </p>
              <DashboardSlTrendChart data={slTrend} />
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Cảnh báo môi trường (DO, NH3, pH)
          </h2>
          {loading ? (
            <p className="mt-3 text-sm text-zinc-500">Đang tải…</p>
          ) : alerts.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
              Không có ao vượt ngưỡng hôm nay (theo bản ghi mới nhất / ngày).
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {alerts.map((a) => {
                const code = ponds.find((p) => p.id === a.pond_id)?.pond_code ?? a.pond_id.slice(0, 8);
                return (
                  <li
                    key={`${a.pond_id}-${a.log_date}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
                  >
                    <span className="font-medium text-amber-950 dark:text-amber-100">Mã ao {code}</span>
                    <span className="text-amber-900 dark:text-amber-200">{a.alert_reason}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            Ngưỡng lấy từ{" "}
            <Link href="/cai-dat" className="text-blue-600 underline dark:text-blue-400">
              Cài đặt
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Cảnh báo thu hoạch (theo ngày)
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Đang tải…</p>
        ) : harvestTiming.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Không có ao nào trong cửa sổ kế hoạch thu (CC/CT, đã có ngày thu, chưa ghi ngày thu thực tế). Cập nhật
            tại{" "}
            <Link href="/vung-nuoi" className="text-blue-600 underline dark:text-blue-400">
              Quản lý vùng nuôi
            </Link>{" "}
            hoặc chạy migration view <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">v_pond_harvest_timing</code>.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-zinc-500">
              Đỏ: quá hạn so với ngày thu hiệu lực. Vàng: trong 7 ngày tới (ưu tiên thu). Nguồn:{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">v_pond_harvest_timing</code>.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {harvestTiming.slice(0, 16).map((h) => {
                const overdue = h.days_until_harvest < 0;
                const priority = !overdue && h.days_until_harvest <= 7;
                const tone = overdue
                  ? "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
                  : priority
                    ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                    : "border-zinc-100 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200";
                return (
                  <li
                    key={h.pond_id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${tone}`}
                  >
                    <span className="font-mono font-medium">{h.pond_code}</span>
                    <span className="text-xs">
                      Thu hiệu lực:{" "}
                      {new Date(h.effective_harvest_date + "T12:00:00").toLocaleDateString("vi-VN")}
                      {overdue ? (
                        <span className="ml-2 font-medium"> · Quá {Math.abs(h.days_until_harvest)} ngày</span>
                      ) : (
                        <span className="ml-2 font-medium"> · Còn {h.days_until_harvest} ngày</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Báo cáo chi tiết:{" "}
              <Link href="/bao-cao/ke-hoach-thu-hoach" className="text-blue-600 underline dark:text-blue-400">
                Kế hoạch thu &amp; sản lượng
              </Link>
              .
            </p>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          THKH — Kế hoạch tấn/tháng theo đại lý ({year})
        </h2>
        {planByAgent.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Chưa có dòng kế hoạch. Nhập tại{" "}
            <Link href="/bang-mau/ke-hoach-thkh" className="text-blue-600 underline dark:text-blue-400">
              THKH mục tiêu / tháng
            </Link>{" "}
            (bảng <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">monthly_harvest_plans</code>).
          </p>
        ) : (
          <>
            <div className="mt-4">
              <DashboardThkhStackedChart planByAgent={planByAgent} />
            </div>
            <div className="mt-6 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-400">Đại lý</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="px-1 py-2 text-center font-medium text-zinc-600 dark:text-zinc-400">
                      T{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planByAgent.map((row) => (
                  <tr key={row.code} className="border-b border-zinc-100 dark:border-zinc-800/80">
                    <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100">{row.name}</td>
                    {row.months.map((v, i) => (
                      <td key={i} className="px-1 py-2 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                        {v ? v.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          THDC — Ngày thu dự kiến: kế hoạch gốc vs điều chỉnh
        </h2>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Đang tải…</p>
        ) : thdc.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Chưa có ao nào có đủ hai ngày (gốc + điều chỉnh). Cập nhật cột{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">adjusted_harvest_date</code> trên ao.
          </p>
        ) : (
          <>
            <div className="mt-4">
              <DashboardThdcDeltaChart ponds={thdc} maxItems={16} />
            </div>
            <ul className="mt-6 space-y-4">
            {thdc.slice(0, 12).map((p) => {
              const planned = p.planned_harvest_date ? new Date(p.planned_harvest_date) : null;
              const adj = p.adjusted_harvest_date ? new Date(p.adjusted_harvest_date) : null;
              const delta =
                planned && adj
                  ? Math.round((adj.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
              const barW = Math.min(100, 50 + Math.abs(delta));
              return (
                <li key={p.id} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {p.pond_code}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Lệch {delta >= 0 ? "+" : ""}
                      {delta} ngày
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <div className="flex-1">
                      <div className="text-zinc-500">Gốc</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">
                        {planned ? planned.toLocaleDateString("vi-VN") : "—"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-zinc-500">Điều chỉnh</div>
                      <div className="font-medium text-blue-700 dark:text-blue-300">
                        {adj ? adj.toLocaleDateString("vi-VN") : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                </li>
              );
            })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
