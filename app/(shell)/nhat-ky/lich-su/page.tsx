import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { JournalHistoryScreen } from "@/components/journal/JournalHistoryScreen";

export default function JournalHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Nhật ký ao", href: "/nhat-ky" },
          { label: "Lịch sử" },
        ]}
        title="Lịch sử nhật ký"
        description="Xem lại các bản ghi đã nhập, lọc theo ao và khoảng ngày."
      />
      <SupabaseConfigBanner />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/nhat-ky" className="font-medium text-blue-600 underline dark:text-blue-400">
          ← Quay lại nhập nhật ký
        </Link>
      </p>
      <JournalHistoryScreen />
    </div>
  );
}
