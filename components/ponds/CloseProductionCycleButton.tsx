"use client";

import { useState } from "react";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { PondRow } from "@/lib/types/pond";
import { btnSecondary } from "@/lib/ui";

function iso(d: string | null | undefined) {
  if (!d) return "";
  return d.slice(0, 10);
}

type Props = {
  pond: PondRow;
  onDone: () => void | Promise<void>;
};

/**
 * Ghi snapshot vòng nuôi hiện tại vào pond_production_cycles, rồi xóa các trường kế hoạch/vụ trên ao
 * để nhập lứa mới (trạng thái CT).
 */
export function CloseProductionCycleButton({ pond, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!supabaseConfigured()) return;
    const ok = window.confirm(
      "Kết thúc vòng nuôi hiện tại?\n\n" +
        "• Hệ thống sẽ lưu một dòng vào lịch sử vòng (snapshot từ ao).\n" +
        "• Sau đó xóa ngày thu / sản lượng / thả cá / tồn trên ao và đặt trạng thái CT để bắt đầu lứa mới.\n" +
        "• Mã ao, chủ hộ, đại lý, QR không đổi.",
    );
    if (!ok) return;
    setBusy(true);
    setErr(null);
    const supabase = createSupabaseBrowserClient();
    const title =
      pond.actual_harvest_date != null
        ? `Vòng — thu ${iso(pond.actual_harvest_date)}`
        : pond.adjusted_harvest_date != null
          ? `Vòng — thu dự kiến ${iso(pond.adjusted_harvest_date)}`
          : pond.planned_harvest_date != null
            ? `Vòng — thu gốc ${iso(pond.planned_harvest_date)}`
            : `Vòng — ${pond.pond_code}`;

    const { error: insErr } = await supabase.from("pond_production_cycles").insert({
      pond_id: pond.id,
      cycle_title: title,
      stocking_date: pond.stocking_date ?? pond.planned_stocking_date,
      planned_harvest_date: pond.planned_harvest_date,
      adjusted_harvest_date: pond.adjusted_harvest_date,
      planned_yield_t: pond.planned_yield_t,
      adjusted_yield_t: pond.adjusted_yield_t,
      actual_harvest_date: pond.actual_harvest_date ?? null,
      actual_harvest_weight_t: pond.actual_harvest_weight_t ?? null,
      notes: "Kết thúc vòng (tự động)",
    });
    if (insErr) {
      setErr(insErr.message);
      setBusy(false);
      return;
    }

    const { error: upErr } = await supabase
      .from("ponds")
      .update({
        status: "CT",
        planned_stocking_date: null,
        stocking_date: null,
        release_count: null,
        total_fish_released: null,
        expected_survival_pct: null,
        planned_harvest_date: null,
        adjusted_harvest_date: null,
        planned_yield_t: null,
        adjusted_yield_t: null,
        expected_harvest_weight_kg: null,
        actual_harvest_date: null,
        actual_harvest_weight_t: null,
        current_avg_weight_kg: null,
        estimated_fish_count: null,
        current_biomass_t: null,
        qa_antibiotic_status: null,
        flesh_color: null,
        fillet_ratio_pct: null,
        process_notes: null,
      })
      .eq("id", pond.id);

    setBusy(false);
    if (upErr) {
      setErr(upErr.message);
      return;
    }
    await onDone();
  };

  if (!supabaseConfigured()) return null;

  return (
    <div className="space-y-1">
      <button type="button" disabled={busy} className={btnSecondary + " text-xs"} onClick={() => void run()}>
        {busy ? "Đang xử lý…" : "Kết thúc vòng → lưu lịch sử & reset ao"}
      </button>
      {err ? (
        <p className="text-xs text-red-600 dark:text-red-400">{err}</p>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dùng khi xong một lứa; dữ liệu vòng chuyển xuống mục lịch sử bên dưới.
        </p>
      )}
    </div>
  );
}
