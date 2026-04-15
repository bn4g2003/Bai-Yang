"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardSlTrendChart, type SlTrendPoint } from "@/components/charts/DashboardSlTrendChart";
import { DashboardThdcDeltaChart } from "@/components/charts/DashboardThdcDeltaChart";
import { DashboardThkhStackedChart } from "@/components/charts/DashboardThkhStackedChart";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
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

function formatTodayVi() {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatTile({
  label,
  value,
  loading,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  loading: boolean;
  tone?: "neutral" | "amber" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
      : tone === "emerald"
        ? "border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
        : "border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/50";
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${toneClass}`}>
      <div className="text-xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
        {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200/80 dark:bg-slate-700" /> : value}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
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

  const harvestUrgentCount = useMemo(() => {
    return harvestTiming.filter((h) => h.days_until_harvest < 0 || h.days_until_harvest <= 7).length;
  }, [harvestTiming]);

  if (!supabaseConfigured()) {
    return null;
  }

  const todayBadge = (
    <span className="inline-flex max-w-full items-center rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-left text-xs font-medium leading-snug text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
      {formatTodayVi()}
    </span>
  );

  const harvestLegend = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-red-200/90 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-900 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100">
        Quá hạn
      </span>
      <span className="rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
        Ưu tiên (≤7 ngày)
      </span>
      <span className="rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        Còn lại
      </span>
    </div>
  );

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <DashboardSection
        title="Hôm nay"
        description="Số liệu gộp từ nhật ký có ngày ghi trùng hôm nay; cảnh báo môi trường theo ngưỡng đã cấu hình."
        headerRight={todayBadge}
      >
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile label="Ao trong hệ thống" value={ponds.length} loading={loading} />
          <StatTile label="Cảnh báo môi trường" value={alerts.length} loading={loading} tone="amber" />
          <StatTile label="Ao cần chú ý thu" value={harvestUrgentCount} loading={loading} tone="emerald" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Thức ăn &amp; hao hụt
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {loading ? (
                  <span className="inline-block h-9 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                ) : (
                  (sl?.total_feed_kg ?? 0).toLocaleString("vi-VN")
                )}
                <span className="ml-1.5 text-base font-normal text-slate-500">kg</span>
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Hao hụt trong ngày:{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {loading ? "…" : (sl?.total_dead_loss ?? 0).toLocaleString("vi-VN")} con
                </span>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Chỉ tính các dòng nhật ký có <span className="font-medium text-slate-600 dark:text-slate-300">ngày nhật ký = hôm nay</span>.
              </p>
            </div>
            {!loading && slTrend.length > 1 ? (
              <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Xu hướng 14 ngày
                </p>
                <div className="mt-3">
                  <DashboardSlTrendChart data={slTrend} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Cảnh báo môi trường (DO, pH, NH3…)
            </p>
            {loading ? (
              <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-5 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100">
                <p className="font-medium">Không có ao vượt ngưỡng hôm nay.</p>
                <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/90">
                  Dựa trên bản ghi nhật ký mới nhất theo từng ao. Chỉnh ngưỡng tại{" "}
                  <Link href="/cai-dat" className="font-semibold underline underline-offset-2">
                    Cài đặt &amp; ngưỡng
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {alerts.map((a) => {
                  const code = ponds.find((p) => p.id === a.pond_id)?.pond_code ?? a.pond_id.slice(0, 8);
                  return (
                    <li
                      key={`${a.pond_id}-${a.log_date}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30"
                    >
                      <span className="font-mono font-semibold text-amber-950 dark:text-amber-100">{code}</span>
                      <span className="text-right text-amber-900 dark:text-amber-200">{a.alert_reason}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Cảnh báo thu hoạch"
        description="Ao đã có ngày thu hiệu lực, chưa ghi ngày thu thực tế — sắp xếp theo mức độ gấp."
        headerRight={harvestLegend}
      >
        {loading ? (
          <div className="space-y-2">
            <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : harvestTiming.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            <p>Chưa có ao nào trong danh sách theo dõi thu (CC/CT, có ngày thu, chưa ghi thu thực tế).</p>
            <p className="mt-2 text-xs">
              Cập nhật kế hoạch thu tại{" "}
              <Link href="/vung-nuoi" className="font-semibold text-blue-600 underline dark:text-blue-400">
                Quản lý vùng nuôi
              </Link>
              . Nếu dữ liệu đã đủ mà vẫn trống, kiểm tra view{" "}
              <code className="rounded bg-slate-200/80 px-1 text-[11px] dark:bg-slate-800">v_pond_harvest_timing</code> trên
              cơ sở dữ liệu.
            </p>
          </div>
        ) : (
          <>
            <ul className="grid gap-2 sm:grid-cols-2">
              {harvestTiming.slice(0, 16).map((h) => {
                const overdue = h.days_until_harvest < 0;
                const priority = !overdue && h.days_until_harvest <= 7;
                const tone = overdue
                  ? "border-red-200/90 bg-red-50/90 text-red-950 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-50"
                  : priority
                    ? "border-amber-200/90 bg-amber-50/90 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-50"
                    : "border-slate-100 bg-slate-50/80 text-slate-800 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200";
                return (
                  <li
                    key={h.pond_id}
                    className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${tone}`}
                  >
                    <span className="font-mono text-sm font-semibold">{h.pond_code}</span>
                    <span className="text-xs sm:text-right">
                      <span className="text-slate-600 dark:text-slate-300">Thu hiệu lực: </span>
                      {new Date(h.effective_harvest_date + "T12:00:00").toLocaleDateString("vi-VN")}
                      {overdue ? (
                        <span className="ml-2 font-semibold">· Quá {Math.abs(h.days_until_harvest)} ngày</span>
                      ) : (
                        <span className="ml-2 font-semibold">· Còn {h.days_until_harvest} ngày</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Chi tiết đầy đủ:{" "}
              <Link href="/bao-cao/ke-hoach-thu-hoach" className="font-semibold text-blue-600 underline dark:text-blue-400">
                Báo cáo kế hoạch thu &amp; sản lượng
              </Link>
            </p>
          </>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Kế hoạch tấn theo tháng — ${year}`}
        description="Mục tiêu THKH đã nhập theo đại lý (tấn/tháng). So sánh nhanh phân bổ theo quý."
      >
        {planByAgent.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            <p>Chưa có dòng kế hoạch cho năm này.</p>
            <p className="mt-2 text-xs">
              Nhập tại{" "}
              <Link href="/bang-mau/ke-hoach-thkh" className="font-semibold text-blue-600 underline dark:text-blue-400">
                THKH mục tiêu / tháng
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="-mx-1 overflow-x-auto pb-1">
              <div className="min-h-[220px] px-1">
                <DashboardThkhStackedChart planByAgent={planByAgent} />
              </div>
            </div>
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="min-w-[720px] w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-left dark:border-slate-800 dark:bg-slate-900/80">
                    <th className="sticky left-0 z-10 bg-slate-50/95 py-3 pl-4 pr-3 font-semibold text-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                      Đại lý
                    </th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th
                        key={i}
                        className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
                      >
                        T{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planByAgent.map((row) => (
                    <tr
                      key={row.code}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800/80 dark:hover:bg-slate-900/40"
                    >
                      <td className="sticky left-0 z-10 bg-white py-2.5 pl-4 pr-3 font-medium text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                        {row.name}
                      </td>
                      {row.months.map((v, i) => (
                        <td
                          key={i}
                          className="px-2 py-2.5 text-center tabular-nums text-slate-700 dark:text-slate-300"
                        >
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
      </DashboardSection>

      <DashboardSection
        title="Lệch ngày thu: gốc và điều chỉnh"
        description="Chỉ các ao đã nhập đủ hai mốc ngày thu — để đối chiếu nhanh độ trễ giữa kế hoạch ban đầu và điều chỉnh."
      >
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : thdc.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            <p>Chưa có ao nào có đủ ngày thu gốc và ngày thu điều chỉnh.</p>
            <p className="mt-2 text-xs">
              Bổ sung ngày trên form ao tại{" "}
              <Link href="/vung-nuoi" className="font-semibold text-blue-600 underline dark:text-blue-400">
                Quản lý vùng nuôi
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <DashboardThdcDeltaChart ponds={thdc} maxItems={16} />
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {thdc.slice(0, 12).map((p) => {
                const planned = p.planned_harvest_date ? new Date(p.planned_harvest_date) : null;
                const adj = p.adjusted_harvest_date ? new Date(p.adjusted_harvest_date) : null;
                const delta =
                  planned && adj
                    ? Math.round((adj.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                const barW = Math.min(100, 50 + Math.abs(delta));
                return (
                  <li
                    key={p.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-800 dark:bg-slate-900/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {p.pond_code}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          delta === 0
                            ? "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                            : delta > 0
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
                              : "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
                        }`}
                      >
                        {delta >= 0 ? "+" : ""}
                        {delta} ngày
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Gốc
                        </div>
                        <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                          {planned ? planned.toLocaleDateString("vi-VN") : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Điều chỉnh
                        </div>
                        <div className="mt-0.5 font-semibold text-blue-700 dark:text-blue-300">
                          {adj ? adj.toLocaleDateString("vi-VN") : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </DashboardSection>
    </div>
  );
}
