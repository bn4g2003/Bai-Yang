import { PageHeader } from "@/components/layout/PageHeader";
import { PondManagement } from "@/components/ponds/PondManagement";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default function VungNuoiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Quản lý vùng nuôi" },
        ]}
        title="Quản lý ao & QR Code"
        description="Số hóa biểu mẫu cấp mã vùng nuôi: thêm ao, trạng thái CC/CT/TH, in QR dán tại ao."
      />
      <SupabaseConfigBanner />
      <PondManagement />
    </div>
  );
}
