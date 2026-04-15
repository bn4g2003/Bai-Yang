import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { AgentsCatalog } from "./AgentsCatalog";

export default function DanhMucDaiLyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Danh mục đại lý" }]}
        eyebrow="Đầu mối & khu vực"
        title="Danh mục đại lý & khu vực"
        description="Đầu mối Mr. Kết, Greenbio, ATM… dùng khi gán ao, báo cáo THKH và lọc kế hoạch thu. Tìm kiếm, nhập/xuất CSV, thêm — sửa — xóa trực tiếp trên Supabase."
      />
      <SupabaseConfigBanner />
      <div className="flex flex-col gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-sky-900/40 dark:bg-sky-950/25">
        <p className="text-sm text-sky-950 dark:text-sky-100">
          <span className="font-semibold">THKH theo tháng:</span> nhập tấn mục tiêu theo đại lý để vẽ biểu đồ trên
          Dashboard.
        </p>
        <Link
          href="/bang-mau/ke-hoach-thkh"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Mở THKH mục tiêu / tháng →
        </Link>
      </div>
      <AgentsCatalog />
    </div>
  );
}
