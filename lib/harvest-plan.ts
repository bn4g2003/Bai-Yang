import type { PondRow } from "@/lib/types/pond";

export function effectiveHarvestDateIso(p: Pick<PondRow, "adjusted_harvest_date" | "planned_harvest_date">): string | null {
  return p.adjusted_harvest_date ?? p.planned_harvest_date ?? null;
}

/** Tấn: ưu tiên nhập tay, không thì tồn × kỳ vọng kg/con / 1000 */
export function computedPlannedYieldT(
  p: Pick<PondRow, "planned_yield_t" | "estimated_fish_count" | "expected_harvest_weight_kg">,
): number | null {
  if (p.planned_yield_t != null) return p.planned_yield_t;
  if (p.estimated_fish_count != null && p.expected_harvest_weight_kg != null) {
    return (p.estimated_fish_count * p.expected_harvest_weight_kg) / 1000;
  }
  return null;
}

export function computedAdjustedYieldT(
  p: Pick<PondRow, "adjusted_yield_t" | "estimated_fish_count" | "expected_harvest_weight_kg">,
): number | null {
  if (p.adjusted_yield_t != null) return p.adjusted_yield_t;
  if (p.estimated_fish_count != null && p.expected_harvest_weight_kg != null) {
    return (p.estimated_fish_count * p.expected_harvest_weight_kg) / 1000;
  }
  return null;
}

export type HarvestTimingKind = "overdue" | "priority" | null;

/** Cảnh báo theo ngày thu (không xét khối lượng). Đã thu = không cảnh báo. */
export function harvestTimingKind(p: PondRow): HarvestTimingKind {
  if (p.status === "TH" || p.actual_harvest_date) return null;
  const iso = effectiveHarvestDateIso(p);
  if (!iso) return null;
  const eff = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eff.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "priority";
  return null;
}

export function harvestTimingLabel(p: PondRow): string {
  const k = harvestTimingKind(p);
  if (k === "overdue") return "Quá hạn thu";
  if (k === "priority") return "Ưu tiên thu";
  if (p.status === "TH" || p.actual_harvest_date) return "Đã thu";
  return "—";
}
