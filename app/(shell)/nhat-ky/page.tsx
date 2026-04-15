import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { NhatKyManualEntry } from "./NhatKyManualEntry";
import { NhatKyToolbar } from "./NhatKyToolbar";

export default function NhatKyLandingPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Nhật ký ao" },
        ]}
        title="Nhật ký ao nuôi"
        description="Quét QR, nhập URL/token/mã ao, hoặc chọn ao trong danh sách — mở form nhật ký để lưu dữ liệu."
      />
      <SupabaseConfigBanner />
      <NhatKyToolbar />
      <NhatKyManualEntry />
      <p className="text-center text-sm">
        <Link
          href="/nhat-ky/lich-su"
          className="font-medium text-blue-600 underline dark:text-blue-400"
        >
          Xem lịch sử nhật ký đã nhập
        </Link>
      </p>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <p>
          URL nhật ký có dạng{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-900">
            /nhat-ky/&lt;qr_token&gt;
          </code>
          . Token được tạo tự động khi lưu ao mới tại mục{" "}
          <Link href="/vung-nuoi" className="font-medium text-blue-600 dark:text-blue-400">
            Quản lý vùng nuôi
          </Link>
          .
        </p>
        <p className="mt-3">
          Sau khi quét, chọn tab <strong className="text-zinc-800 dark:text-zinc-200">Chăm sóc</strong> /{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">Môi trường</strong> /{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">Tình trạng cá</strong> rồi bấm{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">Lưu nhật ký</strong> — dữ liệu ghi vào bảng{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-900">
            daily_pond_logs
          </code>{" "}
          kèm timestamp.
        </p>
      </div>
    </div>
  );
}
