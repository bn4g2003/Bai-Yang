export type PondType = "be" | "dat" | "long";
export type PondStatus = "CC" | "CT" | "TH";
export type QaAntibiotic = "dat" | "khong_dat" | null;

export type PondRow = {
  id: string;
  qr_token: string;
  pond_code: string;
  owner_name: string;
  phone: string | null;
  address: string | null;
  total_area_m2: number | null;
  pond_type: PondType;
  planned_stocking_date: string | null;
  density: number | null;
  fingerling_size: string | null;
  total_fish_released: number | null;
  status: PondStatus;
  agent_id: string | null;
  stocking_date: string | null;
  release_count: number | null;
  expected_survival_pct: number | null;
  planned_harvest_date: string | null;
  planned_yield_t: number | null;
  adjusted_harvest_date: string | null;
  current_avg_weight_kg: number | null;
  estimated_fish_count: number | null;
  current_biomass_t: number | null;
  qa_antibiotic_status: QaAntibiotic;
  flesh_color: string | null;
  fillet_ratio_pct: number | null;
  process_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentRow = {
  id: string;
  code: string;
  name: string;
  region_label: string | null;
  created_at: string;
};

export type DailyPondLogInsert = {
  pond_id: string;
  log_date: string;
  feed_type?: string | null;
  feed_kg?: number | null;
  probiotic?: string | null;
  vitamin?: string | null;
  medicine?: string | null;
  chemicals?: string | null;
  temp_c?: number | null;
  ph?: number | null;
  clarity_cm?: number | null;
  water_color?: string | null;
  no2?: number | null;
  nh3?: number | null;
  do_mg_l?: number | null;
  h2s?: number | null;
  dead_loss_count?: number | null;
  sample_avg_g_per_fish?: number | null;
  disease_signs?: string | null;
  treatment?: string | null;
};
