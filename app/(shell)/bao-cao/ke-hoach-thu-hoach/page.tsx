import { PageHeader } from "@/components/layout/PageHeader";
import { HarvestPlanReport } from "@/components/reports/HarvestPlanReport";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default function BaoCaoKeHoachPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Báo cáo", href: "/bao-cao" },
          { label: "Kế hoạch thu & sản lượng" },
        ]}
        eyebrow="Báo cáo chi tiết"
        title="Báo cáo kế hoạch thu hoạch & sản lượng"
        description="Bộ lọc tháng/năm, đại lý, trạng thái ao; lưới dữ liệu đối chiếu kế hoạch gốc và điều chỉnh."
      />
      <SupabaseConfigBanner />
      <HarvestPlanReport />
    </div>
  );
}
