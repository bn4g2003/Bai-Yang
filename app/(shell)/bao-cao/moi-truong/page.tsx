import { PageHeader } from "@/components/layout/PageHeader";
import { EnvironmentReport } from "@/components/reports/EnvironmentReport";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default function BaoCaoMoiTruongPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Báo cáo" },
          { label: "Môi trường" },
        ]}
        title="Báo cáo môi trường"
        description="Tổng hợp nhanh các chỉ số môi trường đã nhập qua nhật ký ao."
      />
      <SupabaseConfigBanner />
      <EnvironmentReport />
    </div>
  );
}
