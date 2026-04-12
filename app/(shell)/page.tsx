import Link from "next/link";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { overviewTiles } from "@/lib/nav-config";
import { supabaseConfigured } from "@/lib/supabase/client";

export default function OverviewPage() {
  const configured = supabaseConfigured();
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ" }]}
        title="Dashboard"
        description="Tổng quan SL ngày, cảnh báo môi trường, THKH theo tháng và THDC (ngày thu gốc vs điều chỉnh)."
      />
      <SupabaseConfigBanner />
      {configured ? <DashboardOverview /> : null}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Điểm vào nhanh
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overviewTiles.map((tile) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="group flex h-full flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-600"
              >
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">{tile.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {tile.description}
                </span>
                <span className="mt-auto pt-4 text-sm font-semibold text-[var(--app-accent)] group-hover:underline">
                  Mở
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
