-- Ao nuôi — schema cho Supabase (PostgreSQL)
-- Chạy toàn bộ file này trong SQL Editor của Supabase (hoặc psql).
-- MVP: RLS mở cho anon (chỉ dùng khi prototype; khi lên production hãy thu hẹp policy).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --- Bảng phụ ---
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  region_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, value)
VALUES (
  'env_thresholds',
  '{"do_min": 4, "nh3_max": 0.1, "ph_min": 6.5, "ph_max": 8.5}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- --- Ao nuôi (số hóa biểu mẫu cấp mã + kế hoạch) ---
CREATE TABLE IF NOT EXISTS public.ponds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  pond_code text NOT NULL UNIQUE,
  owner_name text NOT NULL,
  phone text,
  address text,

  total_area_m2 numeric,
  pond_type text NOT NULL DEFAULT 'dat'
    CHECK (pond_type IN ('be', 'dat', 'long')),
  planned_stocking_date date,
  density numeric,
  fingerling_size text,
  total_fish_released integer,

  status text NOT NULL DEFAULT 'CT'
    CHECK (status IN ('CC', 'CT', 'TH')),

  agent_id uuid REFERENCES public.agents (id) ON DELETE SET NULL,

  -- Kế hoạch / điều chỉnh thu hoạch (phục vụ THDC & báo cáo)
  stocking_date date,
  release_count integer,
  expected_survival_pct numeric,
  planned_harvest_date date,
  planned_yield_t numeric,
  adjusted_harvest_date date,
  current_avg_weight_kg numeric,
  estimated_fish_count integer,
  current_biomass_t numeric,

  -- QA/QC trước thu
  qa_antibiotic_status text CHECK (qa_antibiotic_status IS NULL OR qa_antibiotic_status IN ('dat', 'khong_dat')),
  flesh_color text,
  fillet_ratio_pct numeric,

  process_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ponds_agent ON public.ponds (agent_id);
CREATE INDEX IF NOT EXISTS idx_ponds_status ON public.ponds (status);
CREATE INDEX IF NOT EXISTS idx_ponds_planned_harvest ON public.ponds (planned_harvest_date);
CREATE INDEX IF NOT EXISTS idx_ponds_adjusted_harvest ON public.ponds (adjusted_harvest_date);

-- --- Nhật ký ao (thay Sheet Data) ---
CREATE TABLE IF NOT EXISTS public.daily_pond_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid NOT NULL REFERENCES public.ponds (id) ON DELETE CASCADE,
  log_date date NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),

  feed_type text,
  feed_kg numeric,
  probiotic text,
  vitamin text,
  medicine text,
  chemicals text,

  temp_c numeric,
  ph numeric,
  clarity_cm numeric,
  water_color text,
  no2 numeric,
  nh3 numeric,
  do_mg_l numeric,
  h2s numeric,

  dead_loss_count integer,
  sample_avg_g_per_fish numeric,
  disease_signs text,
  treatment text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_pond_logs_pond_date ON public.daily_pond_logs (pond_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_pond_logs_recorded ON public.daily_pond_logs (recorded_at DESC);

-- --- THKH: tổng hợp kế hoạch theo đại lý / tháng ---
CREATE TABLE IF NOT EXISTS public.monthly_harvest_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents (id) ON DELETE CASCADE,
  year smallint NOT NULL CHECK (year >= 2000 AND year <= 2100),
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  planned_tonnage numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_harvest_plans_y ON public.monthly_harvest_plans (year, month);

-- --- Công thức / tham số (màn Cài đặt — lưu key-value) ---
CREATE TABLE IF NOT EXISTS public.calculation_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  formula_key text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- --- Hồ sơ user mở rộng (khi bật Supabase Auth) ---
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- --- Trigger cập nhật updated_at ---
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_ponds_updated ON public.ponds;
CREATE TRIGGER tr_ponds_updated
  BEFORE UPDATE ON public.ponds
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_monthly_harvest_plans_updated ON public.monthly_harvest_plans;
CREATE TRIGGER tr_monthly_harvest_plans_updated
  BEFORE UPDATE ON public.monthly_harvest_plans
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_app_settings_updated ON public.app_settings;
CREATE TRIGGER tr_app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- --- View gợi ý: SL ngày (theo ngày báo cáo log_date) ---
CREATE OR REPLACE VIEW public.v_sl_ngay AS
SELECT
  log_date::date AS day,
  COALESCE(SUM(feed_kg), 0) AS total_feed_kg,
  COALESCE(SUM(dead_loss_count), 0) AS total_dead_loss
FROM public.daily_pond_logs
GROUP BY 1;

-- --- View: cảnh báo môi trường từ bản ghi mới nhất mỗi ao / ngày ---
CREATE OR REPLACE VIEW public.v_env_alerts_latest AS
WITH ranked AS (
  SELECT
    l.*,
    ROW_NUMBER() OVER (PARTITION BY l.pond_id, l.log_date ORDER BY l.recorded_at DESC) AS rn
  FROM public.daily_pond_logs l
)
SELECT
  r.id,
  r.pond_id,
  r.log_date,
  r.recorded_at,
  r.do_mg_l,
  r.nh3,
  r.ph,
  CASE
    WHEN r.do_mg_l IS NOT NULL AND r.do_mg_l < (s.value->>'do_min')::numeric THEN 'DO thấp'
    WHEN r.nh3 IS NOT NULL AND r.nh3 > (s.value->>'nh3_max')::numeric THEN 'NH3 cao'
    WHEN r.ph IS NOT NULL AND (r.ph < (s.value->>'ph_min')::numeric OR r.ph > (s.value->>'ph_max')::numeric) THEN 'pH ngoài ngưỡng'
    ELSE NULL
  END AS alert_reason
FROM ranked r
CROSS JOIN public.app_settings s
WHERE s.key = 'env_thresholds'
  AND rn = 1;

-- ============== RLS (prototype — mở full cho anon) ==============
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_pond_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_harvest_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_presets ENABLE ROW LEVEL SECURITY;

-- profiles: bật sau khi đã có auth.users (Supabase)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_anon_all ON public.agents;
CREATE POLICY agents_anon_all ON public.agents FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS agents_auth_all ON public.agents;
CREATE POLICY agents_auth_all ON public.agents FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS app_settings_anon_all ON public.app_settings;
CREATE POLICY app_settings_anon_all ON public.app_settings FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS app_settings_auth_all ON public.app_settings;
CREATE POLICY app_settings_auth_all ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ponds_anon_all ON public.ponds;
CREATE POLICY ponds_anon_all ON public.ponds FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS ponds_auth_all ON public.ponds;
CREATE POLICY ponds_auth_all ON public.ponds FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS daily_pond_logs_anon_all ON public.daily_pond_logs;
CREATE POLICY daily_pond_logs_anon_all ON public.daily_pond_logs FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS daily_pond_logs_auth_all ON public.daily_pond_logs;
CREATE POLICY daily_pond_logs_auth_all ON public.daily_pond_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS monthly_harvest_plans_anon_all ON public.monthly_harvest_plans;
CREATE POLICY monthly_harvest_plans_anon_all ON public.monthly_harvest_plans FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS monthly_harvest_plans_auth_all ON public.monthly_harvest_plans;
CREATE POLICY monthly_harvest_plans_auth_all ON public.monthly_harvest_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS calculation_presets_anon_all ON public.calculation_presets;
CREATE POLICY calculation_presets_anon_all ON public.calculation_presets FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS calculation_presets_auth_all ON public.calculation_presets;
CREATE POLICY calculation_presets_auth_all ON public.calculation_presets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Gợi ý seed đại lý (tùy chọn — bỏ comment nếu cần)
-- INSERT INTO public.agents (code, name, region_label) VALUES
--   ('ket', 'Mr. Kết', 'KV1'),
--   ('dong', 'Mr. Đồng', 'KV2')
-- ON CONFLICT (code) DO NOTHING;

-- Quyền đọc view cho API
GRANT SELECT ON public.v_sl_ngay TO anon, authenticated;
GRANT SELECT ON public.v_env_alerts_latest TO anon, authenticated;
