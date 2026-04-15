import Link from "next/link";

const steps = [
  {
    step: 1,
    title: "Chuẩn bị ao",
    body: "Khai báo chủ hộ, trạng thái CC/CT/TH, in QR dán tại ao.",
    href: "/vung-nuoi",
    cta: "Quản lý vùng nuôi",
  },
  {
    step: 2,
    title: "Ghi nhật ký",
    body: "Hằng ngày: quét QR bằng điện thoại → nhập thức ăn, môi trường, tồn.",
    href: "/nhat-ky",
    cta: "Trang nhập nhật ký (QR)",
  },
  {
    step: 3,
    title: "Theo dõi & báo cáo",
    body: "Xem hướng dẫn từng báo cáo, kế hoạch thu, tổng hợp đại lý và môi trường.",
    href: "/bao-cao",
    cta: "Danh sách báo cáo",
  },
] as const;

export function WorkflowStartStrip() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/15 dark:ring-white/[0.05]">
      <div className="border-b border-slate-100/90 bg-white/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">Luồng làm việc gợi ý</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Ba bước thường gặp. Menu bên trái cũng được nhóm theo thứ tự:{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">Ao &amp; nhật ký</span> →{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">Báo cáo</span> →{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">Danh mục &amp; cài đặt</span>.
        </p>
      </div>
      <div className="p-5 md:p-6">
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.step}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-xs font-bold text-white">
                  {s.step}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{s.title}</span>
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
              <Link
                href={s.href}
                className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--app-accent)] underline-offset-2 hover:underline"
              >
                {s.cta}
                <span className="ml-0.5" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
