import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { MonthlyPlanSummaryReport } from "@/components/reports/MonthlyPlanSummaryReport";

export default function TongHopKeHoachPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Báo cáo tổng hợp kế hoạch" },
        ]}
        title="Báo cáo tổng hợp kế hoạch"
        description="Tổng sản lượng dự kiến theo tháng và đại lý: kế hoạch ban đầu vs điều chỉnh, tách ao đã thả cá (CC) và chưa thả (CT)."
      />
      <SupabaseConfigBanner />
      <MonthlyPlanSummaryReport />
    </div>
  );
}
