import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { JournalHistoryFromSearch } from "@/components/journal/JournalHistoryFromSearch";

export default function JournalHistoryPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Nhật ký ao", href: "/nhat-ky" },
          { label: "Lịch sử" },
        ]}
        eyebrow="Tra cứu"
        title="Lịch sử nhật ký"
        description="Lọc theo ao và khoảng ngày; có thể mở từ cột “Lịch sử” trong Quản lý vùng nuôi để xem đúng một hồ."
      />
      <SupabaseConfigBanner />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Cần nhập nhật ký mới? Quay lại trang mở form theo QR hoặc chọn ao.
        </p>
        <Link
          href="/nhat-ky"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          ← Nhập nhật ký
        </Link>
      </div>

      <JournalHistoryFromSearch />
    </div>
  );
}
