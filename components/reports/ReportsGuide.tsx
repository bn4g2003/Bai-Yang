import Link from "next/link";
import { NavIcon } from "@/components/layout/NavIcons";
import { reportGuideEntries } from "@/lib/reports-guide";

export function ReportsGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        <p>
          Dưới đây là <strong className="font-medium text-zinc-900 dark:text-zinc-100">các báo cáo có sẵn</strong> trong hệ
          thống, thứ tự gần với menu bên trái. Chọn mục để xem hướng dẫn ngắn, rồi bấm{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Mở báo cáo</span> để vào đúng màn hình.
        </p>
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Biểu đồ tổng quan (SL ngày, cảnh báo, THKH) nằm ở <Link href="/" className="font-medium text-blue-600 underline dark:text-blue-400">Dashboard</Link>{" "}
          — không lặp lại trong danh sách này.
        </p>
      </div>

      <ol className="space-y-5">
        {reportGuideEntries.map((r, index) => (
          <li
            key={r.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <NavIcon id={r.icon} className="text-zinc-500 dark:text-zinc-400" />
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    <Link href={r.href} className="hover:text-[var(--app-accent)] hover:underline">
                      {r.title}
                    </Link>
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{r.summary}</p>
                <dl className="grid gap-3 text-sm sm:grid-cols-1">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Mục đích sử dụng
                    </dt>
                    <dd className="mt-1 text-zinc-700 dark:text-zinc-300">{r.purpose}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Bộ lọc / dữ liệu
                    </dt>
                    <dd className="mt-1 text-zinc-700 dark:text-zinc-300">{r.filters}</dd>
                  </div>
                </dl>
                {r.tips.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Lưu ý
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {r.tips.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p>
                  <Link
                    href={r.href}
                    className="text-sm font-semibold text-[var(--app-accent)] underline-offset-2 hover:underline"
                  >
                    Mở báo cáo →
                  </Link>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
