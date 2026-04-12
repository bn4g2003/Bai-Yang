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
        title="Cài đặt & danh mục"
        description="Ngưỡng môi trường, preset công thức; user và phân quyền qua Supabase."
      />
      <SupabaseConfigBanner />
      <SettingsScreen />
    </div>
  );
}
