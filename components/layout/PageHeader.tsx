import type { BreadcrumbItem } from "./Breadcrumbs";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  breadcrumbs: BreadcrumbItem[];
  /** Dòng phụ phía trên tiêu đề (vd: “Tổng quan vận hành”). */
  eyebrow?: string;
  title: string;
  description?: string;
};

/** Khối tiêu đề trang + breadcrumb — dùng lại trên các route trong shell */
export function PageHeader({ breadcrumbs, eyebrow, title, description }: Props) {
  return (
    <header className="border-b border-slate-200/90 pb-8 dark:border-slate-800">
      <Breadcrumbs items={breadcrumbs} />
      {eyebrow ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={`text-2xl font-semibold tracking-tight text-slate-900 md:text-[1.75rem] dark:text-slate-50 ${eyebrow ? "mt-1" : "mt-2"}`}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </header>
  );
}
