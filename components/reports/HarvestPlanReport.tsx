"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableColumn } from "@/components/data-table/types";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AgentRow, PondRow, PondStatus } from "@/lib/types/pond";
import {
  computedAdjustedYieldT,
  computedPlannedYieldT,
  harvestTimingKind,
  harvestTimingLabel,
  remainingHarvestYieldT,
} from "@/lib/harvest-plan";
import { HARVEST_PLAN_EXPORT_HEADERS, harvestPlanRowsForExport } from "@/lib/harvest-export-rows";
import { ExportToolbar } from "@/components/reports/ExportToolbar";

type PondWithAgent = PondRow & { agents: Pick<AgentRow, "name" | "code" | "region_label"> | null };

type ReportRow = PondWithAgent;

const QA_LABEL: Record<string, string> = {
  dat: "Đạt",
  khong_dat: "Không đạt",
};

function monthRef(p: PondRow): Date | null {
  const s = p.adjusted_harvest_date || p.planned_harvest_date;
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function HarvestPlanReport() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [agentId, setAgentId] = useState<string>("");
  const [status, setStatus] = useState<PondStatus | "">("");

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    const [pRes, aRes] = await Promise.all([
      supabase.from("ponds").select("*, agents(name,code,region_label)").order("pond_code"),
      supabase.from("agents").select("*").order("name"),
    ]);
    if (pRes.error) setError(pRes.error.message);
    else setRows((pRes.data ?? []) as ReportRow[]);
    if (!aRes.error && aRes.data) setAgents(aRes.data as AgentRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const markHarvestedOnReport = useCallback(async (r: ReportRow) => {
    if (r.status === "TH" || r.actual_harvest_date) return;
    if (!supabaseConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    setSavingId(r.id);
    setError(null);
    const patch = {
      status: "TH" as const,
      actual_harvest_date: r.actual_harvest_date ?? localDateIso(),
    };
    const { data, error: upErr } = await supabase
      .from("ponds")
      .update(patch)
      .eq("id", r.id)
      .select("*, agents(name,code,region_label)")
      .single();
    if (upErr) setError(upErr.message);
    else if (data) {
      setRows((prev) => prev.map((row) => (row.id === r.id ? (data as ReportRow) : row)));
    }
    setSavingId(null);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = monthRef(r);
      if (d) {
        if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return false;
      } else {
        return false;
      }
      if (agentId && r.agent_id !== agentId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }, [rows, year, month, agentId, status]);

  const columns: DataTableColumn<ReportRow>[] = useMemo(
    () => [
      {
        id: "mark_th",
        header: "Đã thu",
        cell: (r) => {
          const done = r.status === "TH" || Boolean(r.actual_harvest_date);
          if (done) {
            return (
              <input
                type="checkbox"
                checked
                readOnly
                disabled
                className="h-4 w-4 accent-emerald-600"
                title="Đã ghi nhận thu hoạch"
                aria-label="Đã ghi nhận thu hoạch"
              />
            );
          }
          return (
            <input
              type="checkbox"
              checked={false}
              disabled={savingId === r.id}
              className="h-4 w-4 accent-zinc-700"
              title="Đánh dấu đã thu (TH, ghi ngày thu nếu chưa có)"
              aria-label="Đánh dấu đã thu hoạch"
              onChange={() => {
                void markHarvestedOnReport(r);
              }}
            />
          );
        },
      },
      {
        id: "pond_code",
        header: "Mã ao",
        cell: (r) => <span className="font-mono text-sm">{r.pond_code}</span>,
        getSearchText: (r) => r.pond_code,
        headerFilter: "text",
        getFilterValue: (r) => r.pond_code,
      },
      {
        id: "owner",
        header: "Chủ hộ",
        cell: (r) => r.owner_name,
        headerFilter: "text",
        getFilterValue: (r) => r.owner_name,
      },
      {
        id: "region",
        header: "Khu vực",
        cell: (r) => r.agents?.region_label ?? r.agents?.name ?? "—",
        headerFilter: "text",
        getFilterValue: (r) => r.agents?.region_label ?? r.agents?.name ?? "",
      },
      {
        id: "stocking",
        header: "Ngày thả",
        cell: (r) => (r.stocking_date ? fmtDate(r.stocking_date) : "—"),
      },
      {
        id: "release_count",
        header: "SL thả",
        cell: (r) => (r.release_count != null ? String(r.release_count) : "—"),
      },
      {
        id: "survival",
        header: "Tỷ lệ sống kỳ vọng (%)",
        cell: (r) => (r.expected_survival_pct != null ? String(r.expected_survival_pct) : "—"),
      },
      {
        id: "avg_w",
        header: "TB hiện tại (kg/con)",
        cell: (r) => (r.current_avg_weight_kg != null ? r.current_avg_weight_kg.toFixed(3) : "—"),
      },
      {
        id: "est_fish",
        header: "Tồn ước tính (con)",
        cell: (r) => (r.estimated_fish_count != null ? String(r.estimated_fish_count) : "—"),
      },
      {
        id: "exp_w",
        header: "TL kỳ vọng lúc thu (kg/con)",
        cell: (r) => (r.expected_harvest_weight_kg != null ? String(r.expected_harvest_weight_kg) : "—"),
      },
      {
        id: "plan_date",
        header: "Ngày thu dự kiến (gốc)",
        cell: (r) => (r.planned_harvest_date ? fmtDate(r.planned_harvest_date) : "—"),
      },
      {
        id: "plan_yield",
        header: "SL gốc nhập (tấn)",
        cell: (r) => (r.planned_yield_t != null ? String(r.planned_yield_t) : "—"),
      },
      {
        id: "plan_yield_calc",
        header: "SL gốc tính (tấn)",
        cell: (r) => fmtTon(computedPlannedYieldT(r)),
      },
      {
        id: "adj_date",
        header: "Ngày thu (điều chỉnh)",
        cell: (r) => (r.adjusted_harvest_date ? fmtDate(r.adjusted_harvest_date) : "—"),
      },
      {
        id: "adj_yield_in",
        header: "SL điều chỉnh nhập (tấn)",
        cell: (r) => (r.adjusted_yield_t != null ? String(r.adjusted_yield_t) : "—"),
      },
      {
        id: "adj_yield_calc",
        header: "SL điều chỉnh tính (tấn)",
        cell: (r) => fmtTon(computedAdjustedYieldT(r)),
      },
      {
        id: "actual_h",
        header: "Đã thu — ngày",
        cell: (r) => (r.actual_harvest_date ? fmtDate(r.actual_harvest_date) : "—"),
      },
      {
        id: "actual_w",
        header: "Đã thu — tấn",
        cell: (r) => (r.actual_harvest_weight_t != null ? String(r.actual_harvest_weight_t) : "—"),
      },
      {
        id: "remaining_yield",
        header: "Còn phải thu (tấn)",
        cell: (r) => fmtTon(remainingHarvestYieldT(r)),
      },
      {
        id: "harvest_alert",
        header: "Cảnh báo thu",
        cell: (r) => {
          const k = harvestTimingKind(r);
          const label = harvestTimingLabel(r);
          if (k === "overdue") {
            return (
              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-900 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-900">
                {label}
              </span>
            );
          }
          if (k === "priority") {
            return (
              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900">
                {label}
              </span>
            );
          }
          if (r.status === "TH" || r.actual_harvest_date) {
            return (
              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900">
                {label}
              </span>
            );
          }
          return <span className="text-zinc-400">{label}</span>;
        },
      },
      {
        id: "bio",
        header: "Tồn khối lượng (tấn)",
        cell: (r) => (r.current_biomass_t != null ? String(r.current_biomass_t) : "—"),
      },
      {
        id: "qa",
        header: "Kháng sinh",
        cell: (r) =>
          r.qa_antibiotic_status ? QA_LABEL[r.qa_antibiotic_status] ?? r.qa_antibiotic_status : "—",
      },
      {
        id: "flesh",
        header: "Màu thịt",
        cell: (r) => r.flesh_color ?? "—",
      },
      {
        id: "fillet",
        header: "Tỷ lệ phi lê (%)",
        cell: (r) => (r.fillet_ratio_pct != null ? String(r.fillet_ratio_pct) : "—"),
      },
      {
        id: "notes",
        header: "Ghi chú / xử lý",
        cell: (r) => r.process_notes ?? "—",
        headerFilter: "text",
        getFilterValue: (r) => r.process_notes ?? "",
      },
    ],
    [markHarvestedOnReport, savingId],
  );

  if (!supabaseConfigured()) return null;

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="text-sm">
          <span className="text-zinc-500">Tháng</span>
          <select
            className="mt-1 block rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-zinc-500">Năm</span>
          <input
            type="number"
            className="mt-1 block w-28 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          <span className="text-zinc-500">Đại lý / khu vực</span>
          <select
            className="mt-1 block min-w-[10rem] rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            <option value="">Tất cả</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-zinc-500">Trạng thái ao</span>
          <select
            className="mt-1 block rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={status}
            onChange={(e) => setStatus(e.target.value as PondStatus | "")}
          >
            <option value="">Tất cả</option>
            <option value="CC">CC — Đang có cá</option>
            <option value="CT">CT — Kế hoạch thả</option>
            <option value="TH">TH — Đã thu hoạch</option>
          </select>
        </label>
        <p className="text-xs text-zinc-500">
          Lọc theo tháng/năm của{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            ngày thu điều chỉnh (hoặc ngày thu gốc)
          </span>
          .
        </p>
        <ExportToolbar
          title={`Báo cáo kế hoạch thu — ${month}/${year}`}
          fileBase={`ke-hoach-thu-${year}-${String(month).padStart(2, "0")}`}
          sheetName="Ke-hoach-thu"
          headers={HARVEST_PLAN_EXPORT_HEADERS}
          getRows={() => harvestPlanRowsForExport(filtered)}
          disabled={loading || filtered.length === 0}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Đang tải…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <DataTable<ReportRow>
            title="Báo cáo kế hoạch thu & sản lượng"
            columns={columns}
            data={filtered}
            getRowId={(r) => r.id}
            globalSearchPlaceholder="Tìm trong kết quả đã lọc…"
          />
        </div>
      )}
    </div>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

function fmtTon(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

function localDateIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
