"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableColumn } from "@/components/data-table/types";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AgentRow } from "@/lib/types/pond";
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  modalBackdrop,
  modalPanel,
} from "@/lib/ui";

function normalizeCode(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function AgentsCatalog() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AgentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", region_label: "" });

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    const { data, error: qErr } = await supabase.from("agents").select("*").order("name");
    setLoading(false);
    if (qErr) {
      setError(qErr.message);
      return;
    }
    setRows((data ?? []) as AgentRow[]);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", region_label: "" });
    setModalOpen(true);
  };

  const openEdit = (r: AgentRow) => {
    setEditing(r);
    setForm({
      code: r.code,
      name: r.name,
      region_label: r.region_label ?? "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!supabaseConfigured()) return;
    const name = form.name.trim();
    if (!name) {
      setError("Tên đại lý không được để trống.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (editing) {
      const { error: upErr } = await supabase
        .from("agents")
        .update({
          name,
          region_label: form.region_label.trim() || null,
        })
        .eq("id", editing.id);
      setSaving(false);
      if (upErr) {
        setError(upErr.message);
        return;
      }
    } else {
      const code = normalizeCode(form.code);
      if (!code) {
        setError("Mã (code) không hợp lệ — chỉ chữ thường, số, gạch dưới.");
        setSaving(false);
        return;
      }
      const { error: insErr } = await supabase.from("agents").insert({
        code,
        name,
        region_label: form.region_label.trim() || null,
      });
      setSaving(false);
      if (insErr) {
        setError(insErr.message);
        return;
      }
    }
    setModalOpen(false);
    void load();
  };

  const remove = async (r: AgentRow) => {
    if (!supabaseConfigured()) return;
    if (!window.confirm(`Xóa đại lý "${r.name}" (${r.code})? Các ao gắn đại lý này sẽ bỏ liên kết.`)) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: delErr } = await supabase.from("agents").delete().eq("id", r.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    void load();
  };

  const importRow = useCallback(
    (cells: string[]) => {
      if (!supabaseConfigured()) return null;
      const code = normalizeCode(cells[0] ?? "");
      const name = (cells[1] ?? "").trim();
      const region = (cells[2] ?? "").trim() || null;
      if (!code || !name) return null;
      void (async () => {
        const supabase = createSupabaseBrowserClient();
        const { error: insErr } = await supabase.from("agents").upsert(
          { code, name, region_label: region },
          { onConflict: "code" },
        );
        if (insErr) setError(insErr.message);
        else await load();
      })();
      return null;
    },
    [load],
  );

  const columns = useMemo<DataTableColumn<AgentRow>[]>(
    () => [
      {
        id: "code",
        header: "Mã",
        getSearchText: (r) => r.code,
        headerFilter: "text",
        getFilterValue: (r) => r.code,
        cell: (r) => (
          <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{r.code}</span>
        ),
      },
      {
        id: "name",
        header: "Tên đại lý / đầu mối",
        getSearchText: (r) => r.name,
        headerFilter: "text",
        getFilterValue: (r) => r.name,
        cell: (r) => r.name,
      },
      {
        id: "region",
        header: "Khu vực / ghi chú vùng",
        getSearchText: (r) => r.region_label ?? "",
        headerFilter: "text",
        getFilterValue: (r) => r.region_label ?? "",
        cell: (r) => r.region_label ?? "—",
      },
      {
        id: "created",
        header: "Tạo lúc",
        headerFilter: "none",
        cell: (r) =>
          new Date(r.created_at).toLocaleString("vi-VN", {
            dateStyle: "short",
            timeStyle: "short",
          }),
      },
    ],
    [],
  );

  if (!supabaseConfigured()) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải danh mục…</p>
      ) : null}

      <DataTable<AgentRow>
        title="Đại lý & khu vực"
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        rowSelection={{ selectedIds, onSelectedIdsChange: setSelectedIds }}
        onAdd={openCreate}
        addLabel="Thêm đại lý"
        globalSearchPlaceholder="Tìm mã, tên, khu vực…"
        exportHeaders={["Mã (code)", "Tên", "Khu vực"]}
        exportRow={(r) => [r.code, r.name, r.region_label ?? ""]}
        importRow={importRow}
        renderActions={(r) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className={btnSecondary + " !px-2 !py-1.5 text-xs"}
              onClick={() => openEdit(r)}
            >
              Sửa
            </button>
            <button
              type="button"
              className={btnDanger + " !px-2 !py-1.5 text-xs"}
              onClick={() => void remove(r)}
            >
              Xóa
            </button>
          </div>
        )}
      />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Nhập CSV: cột 1 = mã (vd. <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ket</code>), cột 2
        = tên, cột 3 = khu vực. Trùng mã sẽ cập nhật tên và khu vực (
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">upsert</code>).
      </p>

      {modalOpen ? (
        <div className={modalBackdrop}>
          <div className={modalPanel} role="dialog" aria-modal>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {editing ? "Sửa đại lý" : "Thêm đại lý"}
              </h2>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng"
                onClick={() => setModalOpen(false)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className={labelClass}>Mã (code)</span>
                <input
                  disabled={Boolean(editing)}
                  className={`${inputClass} mt-1 disabled:cursor-not-allowed disabled:opacity-60`}
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="vd: ket, greenbio"
                />
                {editing ? (
                  <span className="mt-1 block text-xs text-slate-500">Không đổi mã sau khi tạo.</span>
                ) : null}
              </label>
              <label className="block">
                <span className={labelClass}>Tên hiển thị</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Mr. Kết, Greenbio…"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Khu vực / vùng</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={form.region_label}
                  onChange={(e) => setForm((f) => ({ ...f, region_label: e.target.value }))}
                  placeholder="ĐBSCL — Tiền Giang…"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" className={btnGhost} onClick={() => setModalOpen(false)}>
                Huỷ
              </button>
              <button
                type="button"
                disabled={saving || !form.name.trim() || (!editing && !normalizeCode(form.code))}
                onClick={() => void save()}
                className={btnPrimary}
              >
                {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
