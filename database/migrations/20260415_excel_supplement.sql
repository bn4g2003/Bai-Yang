-- Migration: Excel / cuộc họp — cột bổ sung, view sản lượng & cảnh báo thu, nhiệt độ trong v_env_alerts_latest
-- Chạy trên DB đã tồn tại (sau khi đã có schema cũ). Idempotent.

ALTER TABLE public.ponds
  ADD COLUMN IF NOT EXISTS expected_harvest_weight_kg numeric,
  ADD COLUMN IF NOT EXISTS adjusted_yield_t numeric,
  ADD COLUMN IF NOT EXISTS actual_harvest_date date,
  ADD COLUMN IF NOT EXISTS actual_harvest_weight_t numeric;

ALTER TABLE public.daily_pond_logs
  ADD COLUMN IF NOT EXISTS remaining_fish_count integer;

UPDATE public.app_settings
SET value = value || '{"temp_min": 26, "temp_max": 34}'::jsonb
WHERE key = 'env_thresholds';

-- CREATE OR REPLACE không được phép khi thay đổi thứ tự/tên cột so với view cũ (42P16).
DROP VIEW IF EXISTS public.v_env_alerts_latest CASCADE;

CREATE VIEW public.v_env_alerts_latest AS
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
  r.temp_c,
  r.do_mg_l,
  r.nh3,
  r.ph,
  CASE
    WHEN r.temp_c IS NOT NULL AND s.value ? 'temp_min' AND r.temp_c < (s.value->>'temp_min')::numeric THEN 'Nhiệt độ thấp'
    WHEN r.temp_c IS NOT NULL AND s.value ? 'temp_max' AND r.temp_c > (s.value->>'temp_max')::numeric THEN 'Nhiệt độ cao'
    WHEN r.do_mg_l IS NOT NULL AND r.do_mg_l < (s.value->>'do_min')::numeric THEN 'DO thấp'
    WHEN r.nh3 IS NOT NULL AND r.nh3 > (s.value->>'nh3_max')::numeric THEN 'NH3 cao'
    WHEN r.ph IS NOT NULL AND (r.ph < (s.value->>'ph_min')::numeric OR r.ph > (s.value->>'ph_max')::numeric) THEN 'pH ngoài ngưỡng'
    ELSE NULL
  END AS alert_reason
FROM ranked r
CROSS JOIN public.app_settings s
WHERE s.key = 'env_thresholds'
  AND rn = 1;

GRANT SELECT ON public.v_env_alerts_latest TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_pond_yield_projection AS
SELECT
  p.id AS pond_id,
  p.agent_id,
  p.status,
  p.planned_harvest_date,
  p.adjusted_harvest_date,
  p.planned_yield_t,
  p.adjusted_yield_t,
  p.estimated_fish_count,
  p.expected_harvest_weight_kg,
  COALESCE(
    p.adjusted_yield_t,
    CASE
      WHEN p.estimated_fish_count IS NOT NULL AND p.expected_harvest_weight_kg IS NOT NULL
      THEN (p.estimated_fish_count::numeric * p.expected_harvest_weight_kg) / 1000
    END
  ) AS computed_adjusted_yield_t,
  COALESCE(
    p.planned_yield_t,
    CASE
      WHEN p.estimated_fish_count IS NOT NULL AND p.expected_harvest_weight_kg IS NOT NULL
      THEN (p.estimated_fish_count::numeric * p.expected_harvest_weight_kg) / 1000
    END
  ) AS computed_planned_yield_t
FROM public.ponds p;

CREATE OR REPLACE VIEW public.v_pond_harvest_timing AS
SELECT
  p.id AS pond_id,
  p.pond_code,
  p.status,
  p.agent_id,
  p.planned_harvest_date,
  p.adjusted_harvest_date,
  p.actual_harvest_date,
  COALESCE(p.adjusted_harvest_date, p.planned_harvest_date) AS effective_harvest_date,
  (COALESCE(p.adjusted_harvest_date, p.planned_harvest_date) - CURRENT_DATE) AS days_until_harvest
FROM public.ponds p
WHERE p.status IN ('CC', 'CT')
  AND COALESCE(p.adjusted_harvest_date, p.planned_harvest_date) IS NOT NULL
  AND p.actual_harvest_date IS NULL;

CREATE OR REPLACE VIEW public.v_monthly_yield_by_agent AS
SELECT
  date_trunc('month', COALESCE(y.adjusted_harvest_date, y.planned_harvest_date)::timestamptz)::date AS month_bucket,
  y.agent_id,
  SUM(CASE WHEN y.status = 'CC' THEN COALESCE(y.computed_planned_yield_t, 0) ELSE 0 END) AS tons_planned_initial_cc,
  SUM(CASE WHEN y.status = 'CT' THEN COALESCE(y.computed_planned_yield_t, 0) ELSE 0 END) AS tons_planned_initial_ct,
  SUM(CASE WHEN y.status = 'CC' THEN COALESCE(y.computed_adjusted_yield_t, 0) ELSE 0 END) AS tons_planned_adjusted_cc,
  SUM(CASE WHEN y.status = 'CT' THEN COALESCE(y.computed_adjusted_yield_t, 0) ELSE 0 END) AS tons_planned_adjusted_ct
FROM public.v_pond_yield_projection y
WHERE COALESCE(y.adjusted_harvest_date, y.planned_harvest_date) IS NOT NULL
GROUP BY 1, 2;

GRANT SELECT ON public.v_pond_yield_projection TO anon, authenticated;
GRANT SELECT ON public.v_pond_harvest_timing TO anon, authenticated;
GRANT SELECT ON public.v_monthly_yield_by_agent TO anon, authenticated;
