"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableColumn } from "@/components/data-table/types";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { AgentRow, PondRow, PondStatus, PondType } from "@/lib/types/pond";
import { DesktopQrScanButton } from "@/components/qr/DesktopQrScanButton";
import { downloadQrPng, printQrDataUrl } from "@/lib/print-qr";
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

const POND_TYPE_LABEL: Record<PondType, string> = {
  be: "Bể",
  dat: "Đất",
  long: "Lồng",
};

const STATUS_LABEL: Record<PondStatus, string> = {
  CC: "Đang có cá",
  CT: "Có kế hoạch thả",
  TH: "Đã thu hoạch",
};

function isoDate(d: string | null | undefined) {
  if (!d) return "";
  return d.slice(0, 10);
}

function numStr(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "";
  return String(n);
}

function statusBadge(status: PondStatus) {
  const tone =
    status === "CC"
      ? "bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200"
      : status === "CT"
        ? "bg-sky-500/15 text-sky-900 ring-1 ring-sky-500/25 dark:text-sky-200"
        : "bg-slate-200 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {status} · {STATUS_LABEL[status]}
    </span>
  );
}

type FormState = {
  pond_code: string;
  owner_name: string;
  phone: string;
  address: string;
  total_area_m2: string;
  pond_type: PondType;
  planned_stocking_date: string;
  density: string;
  fingerling_size: string;
  total_fish_released: string;
  status: PondStatus;
  agent_id: string;
  planned_harvest_date: string;
  planned_yield_t: string;
  adjusted_harvest_date: string;
  expected_survival_pct: string;
  current_avg_weight_kg: string;
  estimated_fish_count: string;
  current_biomass_t: string;
  qa_antibiotic_status: "" | "dat" | "khong_dat";
  flesh_color: string;
  fillet_ratio_pct: string;
  process_notes: string;
};

const emptyForm = (): FormState => ({
  pond_code: "",
  owner_name: "",
  phone: "",
  address: "",
  total_area_m2: "",
  pond_type: "dat",
  planned_stocking_date: "",
  density: "",
  fingerling_size: "",
  total_fish_released: "",
  status: "CT",
  agent_id: "",
  planned_harvest_date: "",
  planned_yield_t: "",
  adjusted_harvest_date: "",
  expected_survival_pct: "",
  current_avg_weight_kg: "",
  estimated_fish_count: "",
  current_biomass_t: "",
  qa_antibiotic_status: "",
  flesh_color: "",
  fillet_ratio_pct: "",
  process_notes: "",
});

function pondToForm(p: PondRow): FormState {
  return {
    pond_code: p.pond_code,
    owner_name: p.owner_name,
    phone: p.phone ?? "",
    address: p.address ?? "",
    total_area_m2: numStr(p.total_area_m2),
    pond_type: p.pond_type,
    planned_stocking_date: isoDate(p.planned_stocking_date),
    density: numStr(p.density),
    fingerling_size: p.fingerling_size ?? "",
    total_fish_released: p.total_fish_released != null ? String(p.total_fish_released) : "",
    status: p.status,
    agent_id: p.agent_id ?? "",
    planned_harvest_date: isoDate(p.planned_harvest_date),
    planned_yield_t: numStr(p.planned_yield_t),
    adjusted_harvest_date: isoDate(p.adjusted_harvest_date),
    expected_survival_pct: numStr(p.expected_survival_pct),
    current_avg_weight_kg: numStr(p.current_avg_weight_kg),
    estimated_fish_count: p.estimated_fish_count != null ? String(p.estimated_fish_count) : "",
    current_biomass_t: numStr(p.current_biomass_t),
    qa_antibiotic_status: (p.qa_antibiotic_status as FormState["qa_antibiotic_status"]) || "",
    flesh_color: p.flesh_color ?? "",
    fillet_ratio_pct: numStr(p.fillet_ratio_pct),
    process_notes: p.process_notes ?? "",
  };
}

export function PondManagement() {
  const [ponds, setPonds] = useState<PondRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [lastQr, setLastQr] = useState<{ url: string; dataUrl: string; pondCode: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    const [pRes, aRes] = await Promise.all([
      supabase.from("ponds").select("*").order("created_at", { ascending: false }),
      supabase.from("agents").select("*").order("name"),
    ]);
    if (pRes.error) setError(pRes.error.message);
    else setPonds((pRes.data ?? []) as PondRow[]);
    if (!aRes.error && aRes.data) setAgents(aRes.data as AgentRow[]);
    setLoading(false);
  }, []);

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

  const journalBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/nhat-ky`;
  }, []);

  const makeQrUrl = useCallback(
    (token: string) => `${journalBaseUrl}/${token}`,
    [journalBaseUrl],
  );

  const onPrintQr = useCallback(
    async (row: PondRow) => {
      const url = makeQrUrl(row.qr_token);
      const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      printQrDataUrl(dataUrl, row.pond_code);
    },
    [makeQrUrl],
  );

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (p: PondRow) => {
    setEditingId(p.id);
    setForm(pondToForm(p));
    setOpen(true);
  };

  const removePond = useCallback(async (p: PondRow) => {
    if (!supabaseConfigured()) return;
    if (
      !window.confirm(
        `Xóa ao "${p.pond_code}" (${p.owner_name})? Toàn bộ nhật ký ao này cũng bị xóa.`,
      )
    ) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: delErr } = await supabase.from("ponds").delete().eq("id", p.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    void load();
  }, [load]);

  const parseNum = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const parseIntSafe = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  };

  const buildPayload = () => {
    const plannedDate = form.planned_stocking_date.trim() || null;
    const rel = parseIntSafe(form.total_fish_released);
    return {
      pond_code: form.pond_code.trim(),
      owner_name: form.owner_name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      total_area_m2: parseNum(form.total_area_m2),
      pond_type: form.pond_type,
      planned_stocking_date: plannedDate,
      density: parseNum(form.density),
      fingerling_size: form.fingerling_size.trim() || null,
      total_fish_released: rel,
      status: form.status,
      agent_id: form.agent_id.trim() || null,
      stocking_date: plannedDate,
      release_count: rel,
      planned_harvest_date: form.planned_harvest_date.trim() || null,
      planned_yield_t: parseNum(form.planned_yield_t),
      adjusted_harvest_date: form.adjusted_harvest_date.trim() || null,
      expected_survival_pct: parseNum(form.expected_survival_pct),
      current_avg_weight_kg: parseNum(form.current_avg_weight_kg),
      estimated_fish_count: parseIntSafe(form.estimated_fish_count),
      current_biomass_t: parseNum(form.current_biomass_t),
      qa_antibiotic_status: form.qa_antibiotic_status || null,
      flesh_color: form.flesh_color.trim() || null,
      fillet_ratio_pct: parseNum(form.fillet_ratio_pct),
      process_notes: form.process_notes.trim() || null,
    };
  };

  const submit = async () => {
    if (!supabaseConfigured()) return;
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const payload = buildPayload();

    if (editingId) {
      const { pond_code: _omitCode, ...updatePayload } = payload;
      void _omitCode;
      const { error: upErr } = await supabase.from("ponds").update(updatePayload).eq("id", editingId);
      setSaving(false);
      if (upErr) {
        setError(upErr.message);
        return;
      }
      closeModal();
      void load();
      return;
    }

    const { data, error: insErr } = await supabase
      .from("ponds")
      .insert(payload)
      .select("qr_token, pond_code")
      .single();
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    const token = (data as { qr_token: string; pond_code: string }).qr_token;
    const pondCode = (data as { qr_token: string; pond_code: string }).pond_code;
    const url = makeQrUrl(token);
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });
    setLastQr({ url, dataUrl, pondCode });
    closeModal();
    void load();
  };

  const columns: DataTableColumn<PondRow>[] = useMemo(
    () => [
      {
        id: "pond_code",
        header: "Mã ao",
        cell: (r) => <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{r.pond_code}</span>,
        getSearchText: (r) => r.pond_code,
        headerFilter: "text",
        getFilterValue: (r) => r.pond_code,
      },
      {
        id: "owner",
        header: "Chủ hộ",
        cell: (r) => r.owner_name,
        getSearchText: (r) => r.owner_name,
        headerFilter: "text",
        getFilterValue: (r) => r.owner_name,
      },
      {
        id: "phone",
        header: "Điện thoại",
        cell: (r) => r.phone ?? "—",
        headerFilter: "text",
        getFilterValue: (r) => r.phone ?? "",
      },
      {
        id: "pond_type",
        header: "Loại ao",
        cell: (r) => POND_TYPE_LABEL[r.pond_type],
        headerFilter: "select",
        selectOptions: ["Bể", "Đất", "Lồng"],
        getFilterValue: (r) => POND_TYPE_LABEL[r.pond_type],
      },
      {
        id: "area",
        header: "Diện tích (m²)",
        cell: (r) => (r.total_area_m2 != null ? String(r.total_area_m2) : "—"),
      },
      {
        id: "status",
        header: "Trạng thái",
        cell: (r) => statusBadge(r.status),
        headerFilter: "select",
        selectOptions: ["CC", "CT", "TH"],
        getFilterValue: (r) => r.status,
      },
      {
        id: "agent",
        header: "Đại lý",
        cell: (r) => (r.agent_id ? agentNameById.get(r.agent_id) ?? "—" : "—"),
        headerFilter: "text",
        getFilterValue: (r) => (r.agent_id ? agentNameById.get(r.agent_id) ?? "" : ""),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: (r) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className={btnSecondary + " !px-2 !py-1.5 text-xs"} onClick={() => openEdit(r)}>
              Sửa
            </button>
            <button
              type="button"
              className={btnDanger + " !px-2 !py-1.5 text-xs"}
              onClick={() => void removePond(r)}
            >
              Xóa
            </button>
            <button
              type="button"
              className={btnSecondary + " !px-2 !py-1.5 text-xs"}
              onClick={() => void onPrintQr(r)}
            >
              In QR
            </button>
          </div>
        ),
        headerFilter: "none",
      },
    ],
    [agentNameById, onPrintQr, removePond],
  );

  if (!supabaseConfigured()) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <div className="mb-2 hidden justify-end md:flex">
        <DesktopQrScanButton />
      </div>

      <DataTable<PondRow>
        title="Danh sách ao nuôi"
        columns={columns}
        data={ponds}
        getRowId={(r) => r.id}
        globalSearchPlaceholder="Tìm mã ao, chủ hộ, điện thoại…"
        onAdd={openCreate}
        addLabel="Thêm ao"
      />

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : ponds.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có ao — bấm &quot;Thêm ao&quot;.</p>
      ) : null}

      {open ? (
        <div className={modalBackdrop}>
          <div className={modalPanel + " max-w-xl"} role="dialog" aria-modal>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {editingId ? "Cập nhật ao nuôi" : "Thêm ao mới"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {editingId
                    ? "Mã ao không đổi. QR nhật ký giữ nguyên."
                    : "Sau khi tạo, hệ thống sinh QR duy nhất cho nhật ký ao."}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng"
                onClick={closeModal}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <fieldset className="space-y-3 rounded-lg border border-slate-200/90 p-4 dark:border-slate-700">
                <legend className={`${labelClass} px-1`}>Thông tin chung</legend>
                <label className="block">
                  <span className={labelClass}>Mã ao nuôi</span>
                  <input
                    disabled={Boolean(editingId)}
                    className={`${inputClass} mt-1 disabled:cursor-not-allowed disabled:opacity-60`}
                    value={form.pond_code}
                    onChange={(e) => setForm((f) => ({ ...f, pond_code: e.target.value }))}
                    placeholder="VD: 17 03 006 04"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Tên chủ hộ</span>
                  <input
                    className={`${inputClass} mt-1`}
                    value={form.owner_name}
                    onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Số điện thoại</span>
                  <input
                    className={`${inputClass} mt-1`}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Địa chỉ</span>
                  <textarea
                    className={`${inputClass} mt-1 min-h-[4rem]`}
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </label>
              </fieldset>

              <fieldset className="space-y-3 rounded-lg border border-slate-200/90 p-4 dark:border-slate-700">
                <legend className={`${labelClass} px-1`}>Kỹ thuật</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={labelClass}>Tổng diện tích (m²)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.total_area_m2}
                      onChange={(e) => setForm((f) => ({ ...f, total_area_m2: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Loại ao</span>
                    <select
                      className={`${inputClass} mt-1`}
                      value={form.pond_type}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pond_type: e.target.value as PondType }))
                      }
                    >
                      <option value="be">Bể</option>
                      <option value="dat">Đất</option>
                      <option value="long">Lồng</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Ngày thả dự kiến</span>
                    <input
                      type="date"
                      className={`${inputClass} mt-1`}
                      value={form.planned_stocking_date}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, planned_stocking_date: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Mật độ</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.density}
                      onChange={(e) => setForm((f) => ({ ...f, density: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Size giống</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.fingerling_size}
                      onChange={(e) => setForm((f) => ({ ...f, fingerling_size: e.target.value }))}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelClass}>Tổng số cá thả (con)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.total_fish_released}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, total_fish_released: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Trạng thái ao</span>
                    <select
                      className={`${inputClass} mt-1`}
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value as PondStatus }))
                      }
                    >
                      <option value="CC">CC — Đang có cá</option>
                      <option value="CT">CT — Có kế hoạch thả</option>
                      <option value="TH">TH — Đã thu hoạch</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Đại lý</span>
                    <select
                      className={`${inputClass} mt-1`}
                      value={form.agent_id}
                      onChange={(e) => setForm((f) => ({ ...f, agent_id: e.target.value }))}
                    >
                      <option value="">—</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.code})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset className="space-y-3 rounded-lg border border-slate-200/90 p-4 dark:border-slate-700">
                <legend className={`${labelClass} px-1`}>Kế hoạch thu & chất lượng (tuỳ chọn)</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Ngày thu dự kiến (gốc)</span>
                    <input
                      type="date"
                      className={`${inputClass} mt-1`}
                      value={form.planned_harvest_date}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, planned_harvest_date: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Sản lượng dự kiến (tấn)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.planned_yield_t}
                      onChange={(e) => setForm((f) => ({ ...f, planned_yield_t: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Ngày thu (điều chỉnh)</span>
                    <input
                      type="date"
                      className={`${inputClass} mt-1`}
                      value={form.adjusted_harvest_date}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, adjusted_harvest_date: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tỷ lệ sống kỳ vọng (%)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.expected_survival_pct}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, expected_survival_pct: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>TB khối lượng (kg/con)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.current_avg_weight_kg}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, current_avg_weight_kg: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tồn ước tính (con)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.estimated_fish_count}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, estimated_fish_count: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tồn khối lượng (tấn)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.current_biomass_t}
                      onChange={(e) => setForm((f) => ({ ...f, current_biomass_t: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Kháng sinh (QA)</span>
                    <select
                      className={`${inputClass} mt-1`}
                      value={form.qa_antibiotic_status}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          qa_antibiotic_status: e.target.value as FormState["qa_antibiotic_status"],
                        }))
                      }
                    >
                      <option value="">—</option>
                      <option value="dat">Đạt</option>
                      <option value="khong_dat">Không đạt</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Màu thịt</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.flesh_color}
                      onChange={(e) => setForm((f) => ({ ...f, flesh_color: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Tỷ lệ phi lê (%)</span>
                    <input
                      className={`${inputClass} mt-1`}
                      value={form.fillet_ratio_pct}
                      onChange={(e) => setForm((f) => ({ ...f, fillet_ratio_pct: e.target.value }))}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelClass}>Ghi chú xử lý</span>
                    <textarea
                      className={`${inputClass} mt-1 min-h-[3.5rem]`}
                      rows={2}
                      value={form.process_notes}
                      onChange={(e) => setForm((f) => ({ ...f, process_notes: e.target.value }))}
                    />
                  </label>
                </div>
              </fieldset>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" className={btnGhost} onClick={closeModal}>
                  Huỷ
                </button>
                <button
                  type="button"
                  disabled={saving || !form.pond_code.trim() || !form.owner_name.trim()}
                  onClick={() => void submit()}
                  className={btnPrimary}
                >
                  {saving ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Lưu & tạo QR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {lastQr ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">QR — {lastQr.pondCode}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL động */}
            <img src={lastQr.dataUrl} alt="QR ao" className="mx-auto mt-4 w-56" />
            <p className="mt-3 break-all text-xs text-slate-500">{lastQr.url}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => printQrDataUrl(lastQr.dataUrl, lastQr.pondCode)}
              >
                In QR
              </button>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => downloadQrPng(lastQr.dataUrl, lastQr.pondCode)}
              >
                Tải ảnh PNG
              </button>
              <button type="button" className={btnPrimary} onClick={() => setLastQr(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
