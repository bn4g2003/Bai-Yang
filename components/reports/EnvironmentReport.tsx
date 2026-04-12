"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableColumn } from "@/components/data-table/types";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";

type LogRow = {
  id: string;
  log_date: string;
  recorded_at: string;
  temp_c: number | null;
  ph: number | null;
  do_mg_l: number | null;
  nh3: number | null;
  ponds: { pond_code: string } | null;
};

export function EnvironmentReport() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    const res = await supabase
      .from("daily_pond_logs")
      .select("id,log_date,recorded_at,temp_c,ph,do_mg_l,nh3,ponds(pond_code)")
      .order("recorded_at", { ascending: false })
      .limit(200);
    if (res.error) setError(res.error.message);
    else {
      const raw = (res.data ?? []) as Record<string, unknown>[];
      setRows(
        raw.map((r) => {
          const pondsRaw = r.ponds;
          const ponds =
            pondsRaw == null
              ? null
              : Array.isArray(pondsRaw)
                ? (pondsRaw[0] as { pond_code: string } | undefined) ?? null
                : (pondsRaw as { pond_code: string });
          return { ...r, ponds } as LogRow;
        }),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const columns: DataTableColumn<LogRow>[] = [
    {
      id: "pond",
      header: "Mã ao",
      cell: (r) => (
        <span className="font-mono text-sm">{r.ponds?.pond_code ?? "—"}</span>
      ),
      getSearchText: (r) => r.ponds?.pond_code ?? "",
      headerFilter: "text",
      getFilterValue: (r) => r.ponds?.pond_code ?? "",
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
      header: "Giờ ghi",
      cell: (r) => new Date(r.recorded_at).toLocaleString("vi-VN"),
    },
    {
      id: "temp",
      header: "Nhiệt độ °C",
      cell: (r) => (r.temp_c != null ? String(r.temp_c) : "—"),
    },
    {
      id: "ph",
      header: "pH",
      cell: (r) => (r.ph != null ? String(r.ph) : "—"),
    },
    {
      id: "do",
      header: "DO",
      cell: (r) => (r.do_mg_l != null ? String(r.do_mg_l) : "—"),
    },
    {
      id: "nh3",
      header: "NH3",
      cell: (r) => (r.nh3 != null ? String(r.nh3) : "—"),
    },
  ];

  if (!supabaseConfigured()) return null;

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        200 bản ghi gần nhất — đối chiếu nhanh chỉ số môi trường theo từng lần nhập nhật ký.
      </p>
      {loading ? (
        <p className="text-sm text-zinc-500">Đang tải…</p>
      ) : (
        <DataTable<LogRow>
          title="Nhật ký môi trường"
          columns={columns}
          data={rows}
          getRowId={(r) => r.id}
        />
      )}
    </div>
  );
}
