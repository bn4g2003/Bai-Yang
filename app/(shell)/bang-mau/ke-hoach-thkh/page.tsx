import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MonthlyThkhPlanGrid } from "@/components/plans/MonthlyThkhPlanGrid";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default function KeHoachThkhPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Danh mục đại lý", href: "/bang-mau" },
          { label: "THKH mục tiêu tháng" },
        ]}
        eyebrow="Kế hoạch tấn"
        title="THKH — mục tiêu tấn theo tháng"
        description="Nhập tổng tấn/tháng theo từng đại lý (bảng monthly_harvest_plans). Dữ liệu dùng cho biểu đồ THKH trên Dashboard."
      />
      <SupabaseConfigBanner />
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">Chỉnh sửa danh sách đại lý trước nếu cần thêm đầu mối.</p>
        <Link
          href="/bang-mau"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        >
          ← Danh mục đại lý
        </Link>
      </div>
      <MonthlyThkhPlanGrid />
    </div>
  );
}
