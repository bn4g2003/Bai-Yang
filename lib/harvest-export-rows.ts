import {
  computedAdjustedYieldT,
  computedPlannedYieldT,
  harvestTimingLabel,
  remainingHarvestYieldT,
} from "@/lib/harvest-plan";
import type { AgentRow, PondRow } from "@/lib/types/pond";

export type PondWithAgentExport = PondRow & {
  agents: Pick<AgentRow, "name" | "code" | "region_label"> | null;
};

export const HARVEST_PLAN_EXPORT_HEADERS = [
  "Mã ao",
  "Chủ hộ",
  "Khu vực / Đại lý",
  "Trạng thái",
  "Ngày thả",
  "Tồn (con)",
  "TL kỳ vọng (kg/con)",
  "Ngày thu gốc",
  "SL gốc nhập (tấn)",
  "SL gốc tính",
  "Ngày thu ĐC",
  "SL ĐC nhập",
  "SL ĐC tính",
  "Đã thu — ngày",
  "Đã thu — tấn",
  "Còn phải thu (tấn)",
  "Cảnh báo thu",
  "Ghi chú",
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

function fmtTon(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

export function harvestPlanRowsForExport(rows: PondWithAgentExport[]): (string | number)[][] {
  return rows.map((r) => [
    r.pond_code,
    r.owner_name,
    r.agents?.region_label ?? r.agents?.name ?? "",
    r.status,
    fmtDate(r.stocking_date),
    r.estimated_fish_count ?? "",
    r.expected_harvest_weight_kg ?? "",
    fmtDate(r.planned_harvest_date),
    r.planned_yield_t ?? "",
    fmtTon(computedPlannedYieldT(r)),
    fmtDate(r.adjusted_harvest_date),
    r.adjusted_yield_t ?? "",
    fmtTon(computedAdjustedYieldT(r)),
    fmtDate(r.actual_harvest_date),
    r.actual_harvest_weight_t ?? "",
    fmtTon(remainingHarvestYieldT(r)),
    harvestTimingLabel(r),
    r.process_notes ?? "",
  ]);
}
