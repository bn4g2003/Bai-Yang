"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExportToolbar } from "@/components/reports/ExportToolbar";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AgentRow, MonthlyHarvestPlanRow } from "@/lib/types/pond";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

function parseTon(s: string): number {
  const t = s.trim().replace(",", ".");
  if (!t) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

export function MonthlyThkhPlanGrid() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [draft, setDraft] = useState<Record<string, Record<number, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    setMessage(null);
    const [aRes, pRes] = await Promise.all([
      supabase.from("agents").select("*").order("name"),
      supabase.from("monthly_harvest_plans").select("*").eq("year", year),
    ]);
    const agentList = (aRes.data ?? []) as AgentRow[];
    if (aRes.error) setError(aRes.error.message);
    else setAgents(agentList);

    const nextDraft: Record<string, Record<number, string>> = {};
    for (const a of agentList) {
      nextDraft[a.id] = {};
      for (let m = 1; m <= 12; m++) nextDraft[a.id][m] = "";
    }
    if (!pRes.error && pRes.data) {
      for (const row of pRes.data as MonthlyHarvestPlanRow[]) {
        if (!nextDraft[row.agent_id]) nextDraft[row.agent_id] = {};
        nextDraft[row.agent_id][row.month] =
          row.planned_tonnage != null ? String(row.planned_tonnage) : "";
      }
    }
    setDraft(nextDraft);
    setLoading(false);
  }, [year]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const setCell = (agentId: string, month: number, value: string) => {
    setDraft((d) => ({
      ...d,
      [agentId]: { ...(d[agentId] ?? {}), [month]: value },
    }));
  };

  const saveAll = async () => {
    if (!supabaseConfigured()) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const rows: { agent_id: string; year: number; month: number; planned_tonnage: number }[] = [];
    for (const a of agents) {
      const rowDraft = draft[a.id] ?? {};
      for (let m = 1; m <= 12; m++) {
        const ton = parseTon(rowDraft[m] ?? "");
        rows.push({ agent_id: a.id, year, month: m, planned_tonnage: ton });
      }
    }
    const { error: upErr } = await supabase.from("monthly_harvest_plans").upsert(rows, {
      onConflict: "agent_id,year,month",
    });
    setSaving(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setMessage("Đã lưu mục tiêu tấn/tháng.");
    void load();
  };

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const thkhGridHeaders = useMemo(
    () => ["Đại lý", "Mã", ...months.map((m) => `T${m} (tấn)`)],
    [months],
  );

  const thkhGridRows = useMemo(() => {
    return agents.map((a) => [
      a.name,
      a.code,
      ...months.map((m) => draft[a.id]?.[m] ?? ""),
    ]);
  }, [agents, months, draft]);

  if (!supabaseConfigured()) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-100">Cấu hình Supabase trong .env để nhập THKH.</p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className={labelClass}>Năm</span>
          <input
            type="number"
            className={`${inputClass} mt-1 block w-28`}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <button type="button" className={btnSecondary} onClick={() => void load()} disabled={loading}>
          Tải lại
        </button>
        <button type="button" className={btnPrimary} onClick={() => void saveAll()} disabled={saving || loading}>
          {saving ? "Đang lưu…" : "Lưu tất cả"}
        </button>
        <ExportToolbar
          title={`THKH mục tiêu tháng — năm ${year}`}
          fileBase={`thkh-muc-tieu-${year}`}
          sheetName={`THKH ${year}`}
          headers={thkhGridHeaders}
          getRows={() => thkhGridRows}
          disabled={loading || agents.length === 0}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Đang tải…</p>
      ) : agents.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Chưa có đại lý — thêm tại{" "}
          <Link href="/bang-mau" className="text-blue-600 underline dark:text-blue-400">
            Danh mục đại lý
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900">
                <th className="sticky left-0 z-10 bg-zinc-50 px-3 py-2 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  Đại lý
                </th>
                {months.map((m) => (
                  <th key={m} className="px-1 py-2 text-center font-medium text-zinc-600 dark:text-zinc-400">
                    T{m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800/80">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                    <span className="block truncate max-w-[10rem]" title={a.name}>
                      {a.name}
                    </span>
                    <span className="text-xs font-normal text-zinc-500">{a.code}</span>
                  </td>
                  {months.map((m) => (
                    <td key={m} className="p-0.5">
                      <input
                        className="w-full min-w-0 rounded border border-zinc-200 bg-white px-1 py-1 text-center text-xs tabular-nums dark:border-zinc-700 dark:bg-zinc-900"
                        inputMode="decimal"
                        value={draft[a.id]?.[m] ?? ""}
                        onChange={(e) => setCell(a.id, m, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Dữ liệu lưu vào bảng <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">monthly_harvest_plans</code>{" "}
        (khóa theo đại lý + năm + tháng). Biểu đồ THKH trên Dashboard đọc từ đây.
      </p>
    </div>
  );
}
