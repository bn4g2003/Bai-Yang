-- =============================================================================
-- SEED dữ liệu mẫu — chạy SAU khi đã chạy database/schema.sql
-- Supabase: SQL Editor → dán toàn bộ → Run
--
-- Nội dung:
--   • Upsert đại lý (theo code)
--   • Xóa nhật ký + ao có mã trong danh sách SEED, rồi chèn lại
--   • Upsert kế hoạch THKH (2026 / 2027) — agent_id lấy theo code
--   • Preset công thức mẫu (xóa theo formula_key rồi chèn lại)
--
-- Thử nhật ký (token cố định), ví dụ:
--   /nhat-ky/cccccccc-cccc-cccc-cccc-cccccccc0001  → ao 17 03 006 04
-- =============================================================================

-- --- 1) Đại lý / khu vực ---
INSERT INTO public.agents (id, code, name, region_label) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'ket',      'Mr. Kết',    'ĐBSCL — Tiền Giang'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', 'dung',     'Mr. Dũng',   'ĐBSCL — Bến Tre'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', 'son',      'Mr. Sơn',    'ĐBSCL — Trà Vinh'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', 'dong',     'Mr. Đồng',   'ĐBSCL — Vĩnh Long'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0005', 'dai',      'Mr. Đại',    'ĐBSCL — Sóc Trăng'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0006', 'atm',      'ATM',        'Kênh ATM / Green'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0007', 'greenbio', 'Greenbio',   'Đối tác Greenbio')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  region_label = EXCLUDED.region_label;

-- --- 2) Dọn ao + nhật ký mẫu cũ (chỉ các mã SEED) ---
DELETE FROM public.daily_pond_logs
WHERE pond_id IN (
  SELECT id FROM public.ponds
  WHERE pond_code IN (
    '17 03 006 04', '17 03 006 05', '17 03 007 01',
    '17 03 007 02', '17 04 001 11', '17 04 001 12'
  )
);

DELETE FROM public.ponds
WHERE pond_code IN (
  '17 03 006 04', '17 03 006 05', '17 03 007 01',
  '17 03 007 02', '17 04 001 11', '17 04 001 12'
);

-- --- 3) Ao mẫu (agent_id = id thật trong bảng agents theo code) ---
INSERT INTO public.ponds (
  id, qr_token, pond_code, owner_name, phone, address,
  total_area_m2, pond_type, planned_stocking_date, density, fingerling_size, total_fish_released,
  status, agent_id,
  stocking_date, release_count, expected_survival_pct,
  planned_harvest_date, planned_yield_t, adjusted_harvest_date,
  current_avg_weight_kg, estimated_fish_count, current_biomass_t,
  qa_antibiotic_status, flesh_color, fillet_ratio_pct, process_notes
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccc0001'::uuid,
  '17 03 006 04',
  'Nguyễn Văn An',
  '0912345678',
  'Ấp Phú Thạnh, xã Phú Tân, Tiền Giang',
  3200, 'dat', '2026-02-10'::date, 12, '0.8g', 185000,
  'CC',
  a.id,
  '2026-02-10'::date, 185000, 88,
  '2026-10-15'::date, 42.5, '2026-10-28'::date,
  0.185, 158000, 29.23,
  'dat', 'Trắng hồng', 54.2,
  'Ưu tiên thu — đạt size'
FROM public.agents a WHERE a.code = 'ket';

INSERT INTO public.ponds (
  id, qr_token, pond_code, owner_name, phone, address,
  total_area_m2, pond_type, planned_stocking_date, density, fingerling_size, total_fish_released,
  status, agent_id,
  stocking_date, release_count, expected_survival_pct,
  planned_harvest_date, planned_yield_t, adjusted_harvest_date,
  current_avg_weight_kg, estimated_fish_count, current_biomass_t,
  qa_antibiotic_status, flesh_color, fillet_ratio_pct, process_notes
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccc0002'::uuid,
  '17 03 006 05',
  'Trần Thị Bích',
  '0923456789',
  'Xã Hương Mỹ, Bến Tre',
  2800, 'be', '2026-03-01'::date, 15, '1.0g', 160000,
  'CC',
  a.id,
  '2026-03-01'::date, 160000, 86,
  '2026-11-20'::date, 38.0, '2026-11-08'::date,
  0.172, 132000, 22.70,
  'dat', 'Trắng', 52.0,
  'Chuyển Ecofin'
FROM public.agents a WHERE a.code = 'dung';

INSERT INTO public.ponds (
  id, qr_token, pond_code, owner_name, phone, address,
  total_area_m2, pond_type, planned_stocking_date, density, fingerling_size, total_fish_released,
  status, agent_id,
  stocking_date, release_count, expected_survival_pct,
  planned_harvest_date, planned_yield_t, adjusted_harvest_date,
  current_avg_weight_kg, estimated_fish_count, current_biomass_t,
  qa_antibiotic_status, flesh_color, fillet_ratio_pct, process_notes
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccc0003'::uuid,
  '17 03 007 01',
  'Lê Hoàng Nam',
  '0934567890',
  'Cù lao Minh, Trà Vinh',
  1500, 'long', NULL, 18, '0.6g', NULL,
  'CT',
  a.id,
  NULL, NULL, 85,
  '2027-01-10'::date, 12.0, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  'Có kế hoạch thả — chờ nghiệm thu bè'
FROM public.agents a WHERE a.code = 'son';

INSERT INTO public.ponds (
  id, qr_token, pond_code, owner_name, phone, address,
  total_area_m2, pond_type, planned_stocking_date, density, fingerling_size, total_fish_released,
  status, agent_id,
  stocking_date, release_count, expected_survival_pct,
  planned_harvest_date, planned_yield_t, adjusted_harvest_date,
  current_avg_weight_kg, estimated_fish_count, current_biomass_t,
  qa_antibiotic_status, flesh_color, fillet_ratio_pct, process_notes
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccc0004'::uuid,
  '17 03 007 02',
  'Phạm Minh Tuấn',
  '0945678901',
  'Huyện Tam Bình, Vĩnh Long',
  4100, 'dat', '2026-01-20'::date, 11, '0.9g', 210000,
  'CC',
  a.id,
  '2026-01-20'::date, 210000, 87,
  '2026-09-30'::date, 48.0, '2026-09-18'::date,
  0.198, 175000, 34.65,
  'khong_dat', 'Vàng nhạt', 48.5,
  'Theo dõi kháng sinh — xử lý trước thu'
FROM public.agents a WHERE a.code = 'dong';

INSERT INTO public.ponds (
  id, qr_token, pond_code, owner_name, phone, address,
  total_area_m2, pond_type, planned_stocking_date, density, fingerling_size, total_fish_released,
  status, agent_id,
  stocking_date, release_count, expected_survival_pct,
  planned_harvest_date, planned_yield_t, adjusted_harvest_date,
  current_avg_weight_kg, estimated_fish_count, current_biomass_t,
  qa_antibiotic_status, flesh_color, fillet_ratio_pct, process_notes
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb005'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccc0005'::uuid,
  '17 04 001 11',
  'Võ Thị Hồng',
  '0956789012',
  'Ngã Năm, Sóc Trăng',
  3600, 'dat', '2025-11-05'::date, 13, '1.2g', 195000,
  'TH',
  a.id,
  '2025-11-05'::date, 195000, 89,
  '2026-04-01'::date, 36.0, '2026-03-28'::date,
  0.22, 0, 0,
  'dat', 'Trắng hồng', 55.0,
  'Đã thu — xuất khẩu'
FROM public.agents a WHERE a.code = 'dai';

INSERT INTO public.ponds (
  id, qr_token, pond_code, owner_name, phone, address,
  total_area_m2, pond_type, planned_stocking_date, density, fingerling_size, total_fish_released,
  status, agent_id,
  stocking_date, release_count, expected_survival_pct,
  planned_harvest_date, planned_yield_t, adjusted_harvest_date,
  current_avg_weight_kg, estimated_fish_count, current_biomass_t,
  qa_antibiotic_status, flesh_color, fillet_ratio_pct, process_notes
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb006'::uuid,
  'cccccccc-cccc-cccc-cccc-cccccccc0006'::uuid,
  '17 04 001 12',
  'Đặng Quốc Huy',
  '0967890123',
  'Khu nuôi tập trung Greenbio',
  5200, 'be', '2026-04-15'::date, 14, '0.7g', 240000,
  'CT',
  a.id,
  '2026-04-15'::date, 240000, 88,
  '2026-12-05'::date, 55.0, NULL,
  NULL, NULL, NULL,
  NULL, NULL, NULL,
  'Kế hoạch thả — đại lý Greenbio'
FROM public.agents a WHERE a.code = 'greenbio';

-- --- 4) Nhật ký mẫu (theo ngày ho Chi Minh — SL ngày + cảnh báo) ---
INSERT INTO public.daily_pond_logs (
  pond_id, log_date, recorded_at,
  feed_type, feed_kg, probiotic, vitamin, medicine, chemicals,
  temp_c, ph, clarity_cm, water_color, no2, nh3, do_mg_l, h2s,
  dead_loss_count, sample_avg_g_per_fish, disease_signs, treatment
) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    (timezone('Asia/Ho_Chi_Minh', now()))::date,
    now(),
    'Viên 42%', 420, 'Pro-Lact', 'C', NULL, NULL,
    29.5, 7.8, 35, 'Xanh lá nhạt', 0.02, 0.06, 5.2, 0,
    120, 185, NULL, NULL
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    (timezone('Asia/Ho_Chi_Minh', now()))::date - 1,
    now() - interval '1 day',
    'Viên 42%', 400, 'Pro-Lact', 'C', NULL, NULL,
    28.0, 7.6, 32, 'Xanh', 0.03, 0.08, 4.8, 0,
    200, 178, NULL, NULL
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
    (timezone('Asia/Ho_Chi_Minh', now()))::date,
    now(),
    'Viên 40%', 380, NULL, 'B complex', NULL, NULL,
    30.1, 8.9, 25, 'Vàng', 0.05, 0.14, 3.1, 0.001,
    85, 172, 'Nghi ngờ đục mang', 'Đổi nước 20%, tăng oxy'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004',
    (timezone('Asia/Ho_Chi_Minh', now()))::date - 2,
    now() - interval '2 days',
    'Viên 42%', 510, NULL, NULL, NULL, NULL,
    27.4, 7.2, 40, 'Xanh lá', 0.01, 0.04, 5.8, 0,
    40, 198, NULL, NULL
  );

-- --- 5) THKH — upsert theo (agent_id, year, month) ---
INSERT INTO public.monthly_harvest_plans (agent_id, year, month, planned_tonnage)
SELECT a.id, v.year, v.month, v.tons
FROM public.agents a
JOIN (
  VALUES
    -- Mr. Kết — 2026
    ('ket'::text, 2026::smallint, 1::smallint, 28::numeric),
    ('ket', 2026, 2, 32), ('ket', 2026, 3, 35), ('ket', 2026, 4, 40),
    ('ket', 2026, 5, 45), ('ket', 2026, 6, 48), ('ket', 2026, 7, 50),
    ('ket', 2026, 8, 52), ('ket', 2026, 9, 55), ('ket', 2026, 10, 58),
    ('ket', 2026, 11, 52), ('ket', 2026, 12, 46),
    -- Mr. Dũng — 2026
    ('dung', 2026, 1, 22), ('dung', 2026, 2, 24), ('dung', 2026, 3, 26),
    ('dung', 2026, 4, 30), ('dung', 2026, 5, 34), ('dung', 2026, 6, 36),
    ('dung', 2026, 7, 38), ('dung', 2026, 8, 40), ('dung', 2026, 9, 42),
    ('dung', 2026, 10, 44), ('dung', 2026, 11, 40), ('dung', 2026, 12, 35),
    -- Mr. Sơn — 2026
    ('son', 2026, 1, 15), ('son', 2026, 2, 16), ('son', 2026, 3, 18),
    ('son', 2026, 4, 20), ('son', 2026, 5, 22), ('son', 2026, 6, 24),
    ('son', 2026, 7, 25), ('son', 2026, 8, 26), ('son', 2026, 9, 27),
    ('son', 2026, 10, 28), ('son', 2026, 11, 25), ('son', 2026, 12, 22),
    -- Mr. Đồng — 2027 Q1
    ('dong', 2027, 1, 30), ('dong', 2027, 2, 32), ('dong', 2027, 3, 35)
) AS v(code, year, month, tons) ON a.code = v.code
ON CONFLICT (agent_id, year, month) DO UPDATE SET
  planned_tonnage = EXCLUDED.planned_tonnage,
  updated_at = now();

-- --- 6) Preset công thức (chạy lại seed = ghi đè hai dòng này) ---
DELETE FROM public.calculation_presets
WHERE formula_key IN ('linear_harvest_date', 'biomass_estimate');

INSERT INTO public.calculation_presets (name, formula_key, params, is_default) VALUES
  (
    'Dự báo ngày thu (tuyến tính)',
    'linear_harvest_date',
    '{"daily_weight_gain_g": 1.8, "target_weight_kg": 0.22}'::jsonb,
    true
  ),
  (
    'Biomass tồn (ước lượng)',
    'biomass_estimate',
    '{"avg_weight_kg_field": "current_avg_weight_kg", "count_field": "estimated_fish_count"}'::jsonb,
    false
  );
