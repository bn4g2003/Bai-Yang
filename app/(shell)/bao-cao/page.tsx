import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsGuide } from "@/components/reports/ReportsGuide";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default function BaoCaoHuongDanPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Báo cáo" },
        ]}
        eyebrow="Báo cáo"
        title="Hướng dẫn & danh sách báo cáo"
        description="Chọn đúng báo cáo theo việc cần làm: chi tiết ao, tổng hợp đại lý, hay theo dõi môi trường từ nhật ký."
      />
      <SupabaseConfigBanner />
      <ReportsGuide />
    </div>
  );
}
