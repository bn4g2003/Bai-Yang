import type { BreadcrumbItem } from "./Breadcrumbs";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description?: string;
};

/** Khối tiêu đề trang + breadcrumb — dùng lại trên các route trong shell */
export function PageHeader({ breadcrumbs, title, description }: Props) {
  return (
    <header className="border-b border-slate-200/90 pb-6 dark:border-slate-800">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-[1.65rem] dark:text-slate-50">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      ) : null}
    </header>
  );
}
