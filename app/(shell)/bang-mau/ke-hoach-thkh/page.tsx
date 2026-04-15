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
        title="THKH — mục tiêu tấn theo tháng"
        description="Nhập kế hoạch tổng tấn/tháng theo từng đại lý (bảng monthly_harvest_plans). Dùng cho biểu đồ THKH trên Dashboard."
      />
      <SupabaseConfigBanner />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/bang-mau" className="font-medium text-blue-600 underline dark:text-blue-400">
          ← Danh mục đại lý
        </Link>
      </p>
      <MonthlyThkhPlanGrid />
    </div>
  );
}
