-- THKH nhập tay + lịch sử vòng nuôi theo ao

CREATE TABLE IF NOT EXISTS public.pond_production_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id uuid NOT NULL REFERENCES public.ponds (id) ON DELETE CASCADE,
  cycle_title text,
  stocking_date date,
  planned_harvest_date date,
  adjusted_harvest_date date,
  planned_yield_t numeric,
  adjusted_yield_t numeric,
  actual_harvest_date date,
  actual_harvest_weight_t numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pond_production_cycles_pond ON public.pond_production_cycles (pond_id, created_at DESC);

DROP TRIGGER IF EXISTS tr_pond_production_cycles_updated ON public.pond_production_cycles;
CREATE TRIGGER tr_pond_production_cycles_updated
  BEFORE UPDATE ON public.pond_production_cycles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.pond_production_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pond_production_cycles_anon_all ON public.pond_production_cycles;
CREATE POLICY pond_production_cycles_anon_all ON public.pond_production_cycles FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS pond_production_cycles_auth_all ON public.pond_production_cycles;
CREATE POLICY pond_production_cycles_auth_all ON public.pond_production_cycles FOR ALL TO authenticated USING (true) WITH CHECK (true);
