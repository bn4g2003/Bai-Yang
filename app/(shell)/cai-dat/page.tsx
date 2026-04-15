import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default function CaiDatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Cài đặt & danh mục" },
        ]}
        eyebrow="Cấu hình hệ thống"
        title="Cài đặt & danh mục"
        description="Ngưỡng cảnh báo môi trường, preset công thức; tài khoản và phân quyền quản lý trên Supabase."
      />
      <SupabaseConfigBanner />
      <SettingsScreen />
    </div>
  );
}
