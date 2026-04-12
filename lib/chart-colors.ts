/** Bảng màu biểu đồ — tương phản tốt trên nền sáng/tối */

export const CHART_SERIES = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0d9488",
  "#4f46e5",
  "#ca8a04",
] as const;

export const CHART_AXIS = {
  tick: { fill: "currentColor", fontSize: 11 },
  stroke: "rgba(113, 113, 122, 0.35)",
} as const;

export const CHART_GRID = { stroke: "rgba(113, 113, 122, 0.2)", strokeDasharray: "3 3" } as const;

export const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid rgb(228 228 231)",
  backgroundColor: "rgba(255,255,255,0.96)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
} as const;

export const CHART_TOOLTIP_STYLE_DARK = {
  borderRadius: 10,
  border: "1px solid rgb(63 63 70)",
  backgroundColor: "rgba(24 24 27, 0.96)",
  color: "#fafafa",
  boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
} as const;

/** Tooltip nổi — đọc được trên nền sáng và tối */
export const CHART_TOOLTIP_FLOAT = {
  borderRadius: 10,
  border: "1px solid rgb(82 82 91)",
  backgroundColor: "rgba(24 24 27, 0.94)",
  color: "#fafafa",
  boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
} as const;
