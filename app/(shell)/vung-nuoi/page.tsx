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
        eyebrow="Danh mục ao"
        title="Quản lý ao & QR Code"
        description="Thêm và cập nhật ao, trạng thái CC/CT/TH, in QR dán tại ao; mở lịch sử nhật ký từng ao từ bảng."
      />
      <SupabaseConfigBanner />
      <PondManagement />
    </div>
  );
}
