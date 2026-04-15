"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableColumn } from "@/components/data-table/types";
import { ExportToolbar } from "@/components/reports/ExportToolbar";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AgentRow, DailyPondLogRow, PondRow } from "@/lib/types/pond";
import { btnSecondary, inputClass, labelClass } from "@/lib/ui";

type LogWithPond = DailyPondLogRow & { ponds: Pick<PondRow, "pond_code"> | null };

function fmtNum(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return String(n);
}

type JournalHistoryScreenProps = {
  /** Khi mở từ quản lý ao (`?pond=uuid`), tự lọc theo hồ đó. */
  initialPondId?: string | null;
};

export function JournalHistoryScreen({ initialPondId = null }: JournalHistoryScreenProps) {
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [pondId, setPondId] = useState(() => initialPondId?.trim() ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<LogWithPond[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPonds = useCallback(async () => {
    if (!supabaseConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    const [pRes, aRes] = await Promise.all([
      supabase.from("ponds").select("*").order("pond_code"),
      supabase.from("agents").select("*").order("name"),
    ]);
    if (!pRes.error && pRes.data) setPonds(pRes.data as PondRow[]);
    if (!aRes.error && aRes.data) setAgents(aRes.data as AgentRow[]);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPonds();
    });
  }, [loadPonds]);

  const agentNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of agents) m.set(a.id, a.name);
    return m;
  }, [agents]);

  const loadLogs = useCallback(async () => {
    if (!supabaseConfigured()) return;
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    let q = supabase
      .from("daily_pond_logs")
      .select(
        "id,pond_id,log_date,recorded_at,feed_type,feed_kg,temp_c,ph,do_mg_l,nh3,dead_loss_count,remaining_fish_count,sample_avg_g_per_fish,disease_signs,treatment,ponds(pond_code)",
      )
      .order("log_date", { ascending: false })
      .order("recorded_at", { ascending: false })
      .limit(500);
    if (pondId) q = q.eq("pond_id", pondId);
    if (from) q = q.gte("log_date", from);
    if (to) q = q.lte("log_date", to);
    const res = await q;
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      setRows([]);
      return;
    }
    const raw = (res.data ?? []) as Record<string, unknown>[];
    setRows(
      raw.map((r) => {
        const pr = r.ponds;
        const ponds =
          pr == null ? null : Array.isArray(pr) ? ((pr[0] as { pond_code: string }) ?? null) : (pr as { pond_code: string });
        return { ...r, ponds } as LogWithPond;
      }),
    );
  }, [pondId, from, to]);

  useEffect(() => {
    if (!supabaseConfigured()) return;
    queueMicrotask(() => {
      void loadLogs();
    });
  }, [loadLogs]);

  const columns: DataTableColumn<LogWithPond>[] = useMemo(
    () => [
      {
        id: "pond",
        header: "Mã ao",
        cell: (r) => <span className="font-mono text-sm">{r.ponds?.pond_code ?? "—"}</span>,
        headerFilter: "text",
        getFilterValue: (r) => r.ponds?.pond_code ?? "",
      },
      {
        id: "agent",
        header: "Đại lý",
        cell: (r) => {
          const p = ponds.find((x) => x.id === r.pond_id);
          const name = p?.agent_id ? agentNameById.get(p.agent_id) : undefined;
          return name ?? "—";
        },
        headerFilter: "text",
        getFilterValue: (r) => {
          const p = ponds.find((x) => x.id === r.pond_id);
          return p?.agent_id ? agentNameById.get(p.agent_id) ?? "" : "";
        },
      },
      {
        id: "log_date",
        header: "Ngày nhật ký",
        cell: (r) => r.log_date,
        headerFilter: "text",
        getFilterValue: (r) => r.log_date,
      },
      {
        id: "recorded_at",
        header: "Ghi nhận",
        cell: (r) => new Date(r.recorded_at).toLocaleString("vi-VN"),
      },
      {
        id: "remaining",
        header: "Tồn (con)",
        cell: (r) => fmtNum(r.remaining_fish_count),
      },
      {
        id: "feed_kg",
        header: "Thức ăn (kg)",
        cell: (r) => fmtNum(r.feed_kg),
      },
      {
        id: "temp_c",
        header: "Nhiệt độ",
        cell: (r) => fmtNum(r.temp_c),
      },
      {
        id: "ph",
        header: "pH",
        cell: (r) => fmtNum(r.ph),
      },
      {
        id: "sample",
        header: "Mẫu (g/con)",
        cell: (r) => fmtNum(r.sample_avg_g_per_fish),
      },
    ],
    [ponds, agentNameById],
  );

  const journalExportHeaders = useMemo(
    () => [
      "Mã ao",
      "Đại lý",
      "Ngày nhật ký",
      "Ghi nhận",
      "Tồn (con)",
      "Thức ăn (kg)",
      "Nhiệt độ",
      "pH",
      "Mẫu (g/con)",
    ],
    [],
  );

  const journalExportRows = useMemo(() => {
    return rows.map((r) => {
      const p = ponds.find((x) => x.id === r.pond_id);
      const agent = p?.agent_id ? agentNameById.get(p.agent_id) ?? "" : "";
      return [
        r.ponds?.pond_code ?? "",
        agent,
        r.log_date,
        new Date(r.recorded_at).toLocaleString("vi-VN"),
        r.remaining_fish_count ?? "",
        r.feed_kg ?? "",
        r.temp_c ?? "",
        r.ph ?? "",
        r.sample_avg_g_per_fish ?? "",
      ];
    });
  }, [rows, ponds, agentNameById]);

  const lockedPondLabel = useMemo(() => {
    if (!pondId) return null;
    const p = ponds.find((x) => x.id === pondId);
    return p ? `${p.pond_code} — ${p.owner_name}` : null;
  }, [pondId, ponds]);

  if (!supabaseConfigured()) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-100">Cấu hình Supabase trong .env để xem lịch sử.</p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}

      {initialPondId?.trim() ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
          Đang xem nhật ký{" "}
          {lockedPondLabel ? (
            <>
              của <span className="font-medium">{lockedPondLabel}</span>
            </>
          ) : (
            <>theo ao đã chọn từ quản lý vùng nuôi</>
          )}
          .{" "}
          <Link href="/nhat-ky/lich-su" className="font-medium text-blue-700 underline dark:text-blue-300">
            Xem tất cả ao
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="text-sm">
          <span className="text-zinc-500">Ao</span>
          <select
            className={`${inputClass} mt-1 block min-w-[12rem]`}
            value={pondId}
            onChange={(e) => setPondId(e.target.value)}
          >
            <option value="">Tất cả</option>
            {ponds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pond_code} — {p.owner_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className={labelClass}>Từ ngày</span>
          <input
            type="date"
            className={`${inputClass} mt-1 block`}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className={labelClass}>Đến ngày</span>
          <input
            type="date"
            className={`${inputClass} mt-1 block`}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button type="button" className={btnSecondary} onClick={() => void loadLogs()} disabled={loading}>
          {loading ? "Đang tải…" : "Lọc lại"}
        </button>
        <ExportToolbar
          title="Lịch sử nhật ký ao"
          fileBase={`nhat-ky-lich-su-${from || "all"}-${to || "all"}`}
          sheetName="Nhat ky"
          headers={journalExportHeaders}
          getRows={() => journalExportRows}
          disabled={loading || rows.length === 0}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <DataTable<LogWithPond>
          title="Lịch sử nhật ký"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
          globalSearchPlaceholder="Tìm trong kết quả…"
        />
      </div>
    </div>
  );
}
