"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExportToolbar } from "@/components/reports/ExportToolbar";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AgentRow } from "@/lib/types/pond";

type MonthlyRow = {
  month_bucket: string;
  agent_id: string | null;
  tons_planned_initial_cc: number;
  tons_planned_initial_ct: number;
  tons_planned_adjusted_cc: number;
  tons_planned_adjusted_ct: number;
};

function fmtT(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

function fmtDelta(n: number) {
  if (Number.isNaN(n)) return "—";
  const s = n.toLocaleString("vi-VN", { maximumFractionDigits: 3, signDisplay: "exceptZero" });
  return s;
}

export function MonthlyPlanSummaryReport() {
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const [vRes, aRes] = await Promise.all([
      supabase
        .from("v_monthly_yield_by_agent")
        .select("*")
        .gte("month_bucket", start)
        .lte("month_bucket", end)
        .order("month_bucket"),
      supabase.from("agents").select("*").order("name"),
    ]);
    if (vRes.error) setError(vRes.error.message);
    else setRows((vRes.data ?? []) as MonthlyRow[]);
    if (!aRes.error && aRes.data) setAgents(aRes.data as AgentRow[]);
    setLoading(false);
  }, [year]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const agentNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of agents) m.set(a.id, a.name);
    return m;
  }, [agents]);

  const rowsByAgent = useMemo(() => {
    const m = new Map<string, MonthlyRow[]>();
    for (const r of rows) {
      const id = r.agent_id ?? "__none__";
      if (!m.has(id)) m.set(id, []);
      m.get(id)!.push(r);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.month_bucket.localeCompare(b.month_bucket));
    }
    return m;
  }, [rows]);

  const monthlyExportHeaders = useMemo(
    () => [
      "Đại lý",
      "Tháng (bucket)",
      "KH gốc CC (tấn)",
      "KH gốc CT (tấn)",
      "Điều chỉnh CC (tấn)",
      "Điều chỉnh CT (tấn)",
      "Sai khác CC — ĐC − gốc (tấn)",
      "Sai khác CT — ĐC − gốc (tấn)",
    ],
    [],
  );

  const monthlyExportRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const an = a.agent_id ?? "";
      const bn = b.agent_id ?? "";
      if (an !== bn) return an.localeCompare(bn);
      return a.month_bucket.localeCompare(b.month_bucket);
    });
    return sorted.map((r) => [
      r.agent_id ? agentNameById.get(r.agent_id) ?? r.agent_id : "Chưa gán đại lý",
      r.month_bucket.slice(0, 10),
      r.tons_planned_initial_cc,
      r.tons_planned_initial_ct,
      r.tons_planned_adjusted_cc,
      r.tons_planned_adjusted_ct,
      r.tons_planned_adjusted_cc - r.tons_planned_initial_cc,
      r.tons_planned_adjusted_ct - r.tons_planned_initial_ct,
    ]);
  }, [rows, agentNameById]);

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
          <span className="text-zinc-500">Năm</span>
          <input
            type="number"
            className="mt-1 block w-28 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <p className="max-w-xl text-xs text-zinc-500">
          Tổng tấn theo tháng của <strong className="text-zinc-700 dark:text-zinc-300">ngày thu hiệu lực</strong>{" "}
          (điều chỉnh hoặc gốc). CC = đã thả cá, CT = chưa thả. Số tấn lấy từ nhập tay hoặc công thức tồn × kỳ vọng
          (view <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">v_monthly_yield_by_agent</code>), gồm cả
          vòng nuôi đã lưu trong lịch sử. Cột sai khác = điều chỉnh − gốc theo cùng tháng/đại lý.
        </p>
        <ExportToolbar
          title={`Tổng hợp kế hoạch — năm ${year}`}
          fileBase={`tong-hop-ke-hoach-${year}`}
          sheetName={`THKH ${year}`}
          headers={monthlyExportHeaders}
          getRows={() => monthlyExportRows}
          disabled={loading || rows.length === 0}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Đang tải…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Chưa có dữ liệu kế hoạch thu trong năm này.</p>
      ) : (
        <div className="space-y-8">
          {[...rowsByAgent.entries()].map(([aid, agentRows]) => (
            <section
              key={aid}
              className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <h3 className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                {aid === "__none__" ? "Chưa gán đại lý" : agentNameById.get(aid) ?? aid}
              </h3>
              <table className="min-w-[960px] w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                    <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Tháng</th>
                    <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">KH gốc · CC (tấn)</th>
                    <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">KH gốc · CT (tấn)</th>
                    <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Điều chỉnh · CC (tấn)</th>
                    <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Điều chỉnh · CT (tấn)</th>
                    <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Sai khác · CC (tấn)</th>
                    <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">Sai khác · CT (tấn)</th>
                  </tr>
                </thead>
                <tbody>
                  {agentRows.map((cell) => {
                    const mb = cell.month_bucket.slice(0, 10);
                    const dcc = cell.tons_planned_adjusted_cc - cell.tons_planned_initial_cc;
                    const dct = cell.tons_planned_adjusted_ct - cell.tons_planned_initial_ct;
                    return (
                      <tr key={mb} className="border-b border-zinc-100 dark:border-zinc-800/80">
                        <td className="px-3 py-2 tabular-nums text-zinc-800 dark:text-zinc-200">
                          {new Date(mb + "T12:00:00").toLocaleDateString("vi-VN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{fmtT(cell.tons_planned_initial_cc)}</td>
                        <td className="px-3 py-2 tabular-nums">{fmtT(cell.tons_planned_initial_ct)}</td>
                        <td className="px-3 py-2 tabular-nums">{fmtT(cell.tons_planned_adjusted_cc)}</td>
                        <td className="px-3 py-2 tabular-nums">{fmtT(cell.tons_planned_adjusted_ct)}</td>
                        <td className="px-3 py-2 tabular-nums">{fmtDelta(dcc)}</td>
                        <td className="px-3 py-2 tabular-nums">{fmtDelta(dct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
