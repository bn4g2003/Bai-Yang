import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  /** Ví dụ chip ngày, nút phụ — canh phải trên desktop. */
  headerRight?: ReactNode;
  children: ReactNode;
};

/** Khối nội dung Dashboard: tiêu đề rõ, nền và viền thống nhất. */
export function DashboardSection({ title, description, headerRight, children }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-800 dark:bg-slate-950 dark:ring-white/[0.06]">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/95 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:from-slate-900/90 dark:to-slate-950">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
