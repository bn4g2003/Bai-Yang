import { PageHeader } from "@/components/layout/PageHeader";
import { HarvestPlanReport } from "@/components/reports/HarvestPlanReport";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default function BaoCaoKeHoachPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Báo cáo" },
          { label: "Kế hoạch thu & sản lượng" },
        ]}
        title="Báo cáo kế hoạch thu hoạch & sản lượng"
        description="Bộ lọc tháng/năm, đại lý, trạng thái ao; lưới dữ liệu đối chiếu kế hoạch gốc và điều chỉnh."
      />
      <SupabaseConfigBanner />
      <HarvestPlanReport />
    </div>
  );
}
