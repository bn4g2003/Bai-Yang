-- Kích hoạt extension để tự động sinh UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* =====================================================================
   PHÂN HỆ 1: THIẾT LẬP VÀ KIỂM ĐỊNH ĐẦU VÀO (PRE-STOCKING QC)
===================================================================== */

-- 1. Bảng quản lý Đơn vị liên kết (Tách ra để dễ quản lý Target Bảng 10)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- Vd: Mr. Kết, Mr. Dũng, Mr. Đồng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng 1: Quản lý Chủ hộ
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng 2: Quản lý Ao nuôi & Mã QR
CREATE TABLE ponds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
    pond_code VARCHAR(50) UNIQUE NOT NULL, -- Vd: 17 03 006 04
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('CC', 'CT')) DEFAULT 'CT', -- CC: Có cá, CT: Chuẩn bị thả
    area_m2 DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng 3: Đánh giá điều kiện ao nuôi
CREATE TABLE pond_conditions_qc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id UUID REFERENCES ponds(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    distance_to_factory_km DECIMAL(5,2),
    flood_risk VARCHAR(50),
    mud_depth_cm DECIMAL(5,2), -- Target: 20-40cm
    aerator_count INTEGER, -- Target: 4-6 giàn
    water_color VARCHAR(100), -- Vd: Xanh nõn chuối
    ph DECIMAL(4,2), -- Target: 7-9
    do_mg_l DECIMAL(5,2), -- Target: >= 5mg/l
    nh3_mg_l DECIMAL(5,2), -- Target: 0
    technician_name VARCHAR(255),
    is_passed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* =====================================================================
   PHÂN HỆ 2: QUẢN LÝ VỤ NUÔI & NHẬT KÝ VẬN HÀNH (OPERATIONS)
===================================================================== */

-- 5. Bảng 5: Quản lý Đợt thả giống (Vụ nuôi)
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id UUID REFERENCES ponds(id) ON DELETE CASCADE,
    stocking_date DATE NOT NULL,
    initial_quantity INTEGER NOT NULL, -- Tổng số cá thả
    initial_avg_weight_g DECIMAL(10,2) NOT NULL, -- Trọng lượng TB ban đầu
    target_survival_rate DECIMAL(5,2) DEFAULT 85.00, -- Tỷ lệ sống mục tiêu (%)
    is_active BOOLEAN DEFAULT TRUE, -- Đang nuôi hay đã thu hoạch
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng 4: Kiểm tra chất lượng cá giống (Gắn liền với Vụ nuôi lúc thả)
CREATE TABLE seed_qc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    avg_size_cm DECIMAL(5,2), -- Target: 4-6 cm
    avg_weight_g DECIMAL(10,2), -- Target: 5-10 g
    deformity_rate DECIMAL(5,2), -- Target: <= 1%
    quarantine_cert_url TEXT, -- Link file phiếu kiểm dịch
    appearance TEXT,
    swimming_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng 6: Nhật ký Hàng ngày
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Thông tin thức ăn
    feed_code VARCHAR(100),
    feed_amount_kg DECIMAL(10,2),
    dead_fish_count INTEGER DEFAULT 0,
    -- Môi trường
    temperature_c DECIMAL(5,2),
    ph DECIMAL(4,2),
    transparency_cm DECIMAL(5,2),
    water_color VARCHAR(100),
    do_mg_l DECIMAL(5,2),
    nh3_mg_l DECIMAL(5,2),
    no2_mg_l DECIMAL(5,2),
    h2s_mg_l DECIMAL(5,2),
    -- Sức khỏe/Bệnh dịch
    disease_detected BOOLEAN DEFAULT FALSE,
    disease_symptoms TEXT,
    disease_cause TEXT,
    treatment_method TEXT,
    treatment_result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Bảng 7: Cân mẫu định kỳ
CREATE TABLE periodic_samplings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    sample_date DATE NOT NULL DEFAULT CURRENT_DATE,
    avg_weight_g DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* =====================================================================
   PHÂN HỆ 3: KIỂM SOÁT THU HOẠCH ĐẦU RA (HARVEST QC)
===================================================================== */

-- 9. Bảng 8: Thu hoạch thực tế
CREATE TABLE harvests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    harvest_date DATE NOT NULL,
    total_days INTEGER, -- Có thể tự tính từ stocking_date
    total_yield_kg DECIMAL(12,2) NOT NULL,
    -- Phân loại size
    size_under_200g_kg DECIMAL(12,2) DEFAULT 0,
    size_200_300g_kg DECIMAL(12,2) DEFAULT 0,
    size_301_500g_kg DECIMAL(12,2) DEFAULT 0,
    size_over_500g_kg DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Bảng 9: Đánh giá chất lượng thu mua (QC Harvest)
CREATE TABLE harvest_qc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    harvest_id UUID REFERENCES harvests(id) ON DELETE CASCADE,
    -- Chỉ số an toàn
    chloramphenicol_detected BOOLEAN DEFAULT FALSE, -- Target: False
    florfenicol_detected BOOLEAN DEFAULT FALSE, -- Target: False
    lead_mg_kg DECIMAL(5,2), -- Target: <= 0.5
    cadmium_mg_kg DECIMAL(5,2),
    -- Ngoại quan
    microwave_test_passed BOOLEAN, -- Test mùi bùn/rêu
    has_disease_or_yellow_meat BOOLEAN DEFAULT FALSE,
    -- Chỉ tiêu tài chính
    fillet_percentage DECIMAL(5,2), -- Target: >= 42%
    stomach_weight_g DECIMAL(5,2), -- Target: <= 5g
    deduction_percentage DECIMAL(5,2) DEFAULT 0, -- Tỷ lệ trừ lùi hệ thống tự tính
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* =====================================================================
   PHÂN HỆ 4: BÁO CÁO KẾ HOẠCH & SẢN LƯỢNG (ANALYTICS)
===================================================================== */

-- 11. Bảng 10: Kế hoạch Target Sản lượng
CREATE TABLE target_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    target_year INTEGER NOT NULL,
    target_month INTEGER NOT NULL CHECK (target_month BETWEEN 1 AND 12),
    target_percentage DECIMAL(5,2), -- Vd: 39.00 cho 39%
    target_yield_tonnes DECIMAL(12,2), -- Sản lượng kỳ vọng bằng Tấn
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, target_year, target_month) -- Chống trùng lặp kế hoạch
);

/* =====================================================================
   THIẾT LẬP INDEX ĐỂ TỐI ƯU TRUY VẤN (Tốc độ cho Dashboard Real-time)
===================================================================== */
CREATE INDEX idx_ponds_owner_id ON ponds(owner_id);
CREATE INDEX idx_batches_pond_id ON batches(pond_id);
CREATE INDEX idx_daily_logs_batch_date ON daily_logs(batch_id, log_date);
CREATE INDEX idx_harvests_batch_id ON harvests(batch_id);