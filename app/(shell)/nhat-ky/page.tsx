import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { NhatKyManualEntry } from "./NhatKyManualEntry";
import { NhatKyToolbar } from "./NhatKyToolbar";

export default function NhatKyLandingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Nhật ký ao" },
        ]}
        eyebrow="Vận hành tại ao"
        title="Nhật ký ao nuôi"
        description="Quét QR, dán link hoặc token, hoặc chọn ao — mở form nhập nhật ký trên điện thoại hoặc máy tính."
      />
      <SupabaseConfigBanner />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(20rem,34%)] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-950 dark:ring-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">Quét mã</span> bằng webcam (nếu trình
              duyệt cho phép).
            </p>
            <NhatKyToolbar />
          </div>
          <NhatKyManualEntry />
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white p-5 text-sm shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 dark:ring-white/[0.04] lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Hướng dẫn nhanh
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">
            URL nhật ký có dạng{" "}
            <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              /nhat-ky/&lt;token&gt;
            </code>
            . Token tạo khi lưu ao mới tại{" "}
            <Link href="/vung-nuoi" className="font-semibold text-[var(--app-accent)] underline-offset-2 hover:underline">
              Quản lý vùng nuôi
            </Link>
            .
          </p>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400">
            Trong form nhật ký: dùng các tab <strong className="text-slate-800 dark:text-slate-200">Chăm sóc</strong>,{" "}
            <strong className="text-slate-800 dark:text-slate-200">Môi trường</strong>,{" "}
            <strong className="text-slate-800 dark:text-slate-200">Tình trạng cá</strong>, rồi{" "}
            <strong className="text-slate-800 dark:text-slate-200">Lưu nhật ký</strong>.
          </p>
          <div className="border-t border-slate-200/80 pt-4 dark:border-slate-700">
            <Link
              href="/nhat-ky/lich-su"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-[var(--app-accent)] shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Xem lịch sử nhật ký đã nhập
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
