"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { PondProductionCycleRow } from "@/lib/types/pond";
import { btnDanger, btnGhost, btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

type CycleForm = {
  cycle_title: string;
  stocking_date: string;
  planned_harvest_date: string;
  adjusted_harvest_date: string;
  planned_yield_t: string;
  adjusted_yield_t: string;
  actual_harvest_date: string;
  actual_harvest_weight_t: string;
  notes: string;
};

const emptyCycleForm = (): CycleForm => ({
  cycle_title: "",
  stocking_date: "",
  planned_harvest_date: "",
  adjusted_harvest_date: "",
  planned_yield_t: "",
  adjusted_yield_t: "",
  actual_harvest_date: "",
  actual_harvest_weight_t: "",
  notes: "",
});

function iso(d: string | null | undefined) {
  if (!d) return "";
  return d.slice(0, 10);
}

function parseNum(s: string) {
  const t = s.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function PondProductionCyclesBlock({
  pondId,
  refreshKey = 0,
}: {
  pondId: string | null;
  /** Tăng sau khi kết thúc vòng / cập nhật ao để tải lại danh sách */
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<PondProductionCycleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CycleForm>(() => emptyCycleForm());

  const load = useCallback(async () => {
    if (!pondId || !supabaseConfigured()) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: qErr } = await supabase
      .from("pond_production_cycles")
      .select("*")
      .eq("pond_id", pondId)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (qErr) {
      setError(qErr.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as PondProductionCycleRow[]);
  }, [pondId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load, refreshKey]);

  const submitAdd = async () => {
    if (!pondId || !supabaseConfigured()) return;
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: insErr } = await supabase.from("pond_production_cycles").insert({
      pond_id: pondId,
      cycle_title: form.cycle_title.trim() || null,
      stocking_date: form.stocking_date.trim() || null,
      planned_harvest_date: form.planned_harvest_date.trim() || null,
      adjusted_harvest_date: form.adjusted_harvest_date.trim() || null,
      planned_yield_t: parseNum(form.planned_yield_t),
      adjusted_yield_t: parseNum(form.adjusted_yield_t),
      actual_harvest_date: form.actual_harvest_date.trim() || null,
      actual_harvest_weight_t: parseNum(form.actual_harvest_weight_t),
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setForm(emptyCycleForm());
    setOpenAdd(false);
    void load();
  };

  const remove = async (id: string) => {
    if (!supabaseConfigured()) return;
    if (!window.confirm("Xóa dòng vòng nuôi này?")) return;
    const supabase = createSupabaseBrowserClient();
    const { error: delErr } = await supabase.from("pond_production_cycles").delete().eq("id", id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    void load();
  };

  if (!pondId) return null;

  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200/90 p-4 dark:border-slate-700">
      <legend className={`${labelClass} px-1`}>Vòng nuôi (lịch sử)</legend>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Ghi các lứa đã kết thúc hoặc kế hoạch lứa tiếp theo trên cùng ao (2–3 vòng/năm). Dữ liệu hiện tại của ao vẫn nằm ở các trường phía trên.
      </p>
      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-xs text-slate-500">Đang tải…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa có dòng lịch sử.</p>
      ) : (
        <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {r.cycle_title || "Vòng nuôi"}
                </span>
                <span className="mt-0.5 block text-slate-600 dark:text-slate-400">
                  Thả: {r.stocking_date ? iso(r.stocking_date) : "—"} · Thu dự kiến:{" "}
                  {r.adjusted_harvest_date ? iso(r.adjusted_harvest_date) : r.planned_harvest_date ? iso(r.planned_harvest_date) : "—"}
                  {r.actual_harvest_date ? ` · Đã thu ${iso(r.actual_harvest_date)}` : ""}
                </span>
              </div>
              <button type="button" className={btnDanger + " !px-2 !py-1 text-xs"} onClick={() => void remove(r.id)}>
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}

      {!openAdd ? (
        <button type="button" className={btnSecondary + " text-xs"} onClick={() => setOpenAdd(true)}>
          Thêm vòng nuôi
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-600">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Tên / ghi chú vòng</span>
              <input
                className={`${inputClass} mt-1`}
                value={form.cycle_title}
                onChange={(e) => setForm((f) => ({ ...f, cycle_title: e.target.value }))}
                placeholder="VD: Lứa 1 — 2026"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Ngày thả</span>
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={form.stocking_date}
                onChange={(e) => setForm((f) => ({ ...f, stocking_date: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Ngày thu (gốc)</span>
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={form.planned_harvest_date}
                onChange={(e) => setForm((f) => ({ ...f, planned_harvest_date: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Ngày thu (điều chỉnh)</span>
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={form.adjusted_harvest_date}
                onChange={(e) => setForm((f) => ({ ...f, adjusted_harvest_date: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>SL gốc (tấn)</span>
              <input
                className={`${inputClass} mt-1`}
                value={form.planned_yield_t}
                onChange={(e) => setForm((f) => ({ ...f, planned_yield_t: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>SL điều chỉnh (tấn)</span>
              <input
                className={`${inputClass} mt-1`}
                value={form.adjusted_yield_t}
                onChange={(e) => setForm((f) => ({ ...f, adjusted_yield_t: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Ngày thu thực tế</span>
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={form.actual_harvest_date}
                onChange={(e) => setForm((f) => ({ ...f, actual_harvest_date: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Sản lượng thực tế (tấn)</span>
              <input
                className={`${inputClass} mt-1`}
                value={form.actual_harvest_weight_t}
                onChange={(e) => setForm((f) => ({ ...f, actual_harvest_weight_t: e.target.value }))}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Ghi chú</span>
              <textarea
                className={`${inputClass} mt-1 min-h-[3rem]`}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary + " text-xs"} disabled={saving} onClick={() => void submitAdd()}>
              {saving ? "Đang lưu…" : "Lưu vòng"}
            </button>
            <button type="button" className={btnGhost + " text-xs"} onClick={() => setOpenAdd(false)}>
              Huỷ
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}
