import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { AgentsCatalog } from "./AgentsCatalog";

export default function DanhMucDaiLyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Danh mục đại lý" }]}
        title="Danh mục đại lý & khu vực"
        description="Đầu mối Mr. Kết, Greenbio, ATM… dùng khi gán ao, báo cáo THKH và lọc kế hoạch thu. Tìm kiếm, nhập/xuất CSV, thêm — sửa — xóa trực tiếp trên Supabase."
      />
      <SupabaseConfigBanner />
      <p className="text-sm">
        <Link
          href="/bang-mau/ke-hoach-thkh"
          className="font-medium text-blue-600 underline dark:text-blue-400"
        >
          THKH mục tiêu tấn/tháng theo đại lý
        </Link>{" "}
        (biểu đồ Dashboard).
      </p>
      <AgentsCatalog />
    </div>
  );
}
