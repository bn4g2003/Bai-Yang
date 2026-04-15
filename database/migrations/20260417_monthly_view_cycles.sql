-- Gộp pond_production_cycles vào v_monthly_yield_by_agent (cùng tháng / đại lý / tách CC·CT)

CREATE OR REPLACE VIEW public.v_monthly_yield_by_agent AS
WITH line AS (
  SELECT
    date_trunc('month', COALESCE(y.adjusted_harvest_date, y.planned_harvest_date)::timestamptz)::date AS month_bucket,
    y.agent_id,
    y.status,
    COALESCE(y.computed_planned_yield_t, 0) AS cp,
    COALESCE(y.computed_adjusted_yield_t, 0) AS ca
  FROM public.v_pond_yield_projection y
  WHERE COALESCE(y.adjusted_harvest_date, y.planned_harvest_date) IS NOT NULL
  UNION ALL
  SELECT
    date_trunc('month', COALESCE(c.adjusted_harvest_date, c.planned_harvest_date)::timestamptz)::date,
    p.agent_id,
    'CC'::text AS status,
    COALESCE(c.planned_yield_t, 0),
    COALESCE(c.adjusted_yield_t, c.planned_yield_t, 0)
  FROM public.pond_production_cycles c
  INNER JOIN public.ponds p ON p.id = c.pond_id
  WHERE COALESCE(c.adjusted_harvest_date, c.planned_harvest_date) IS NOT NULL
)
SELECT
  month_bucket,
  agent_id,
  SUM(CASE WHEN status = 'CC' THEN cp ELSE 0 END) AS tons_planned_initial_cc,
  SUM(CASE WHEN status = 'CT' THEN cp ELSE 0 END) AS tons_planned_initial_ct,
  SUM(CASE WHEN status = 'CC' THEN ca ELSE 0 END) AS tons_planned_adjusted_cc,
  SUM(CASE WHEN status = 'CT' THEN ca ELSE 0 END) AS tons_planned_adjusted_ct
FROM line
GROUP BY 1, 2;
