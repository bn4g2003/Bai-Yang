import Link from "next/link";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { WorkflowStartStrip } from "@/components/dashboard/WorkflowStartStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";
import { overviewTileGroups } from "@/lib/nav-config";
import { supabaseConfigured } from "@/lib/supabase/client";

export default function OverviewPage() {
  const configured = supabaseConfigured();
  return (
    <div className="space-y-10 pb-4">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ" }]}
        eyebrow="Tổng quan vận hành"
        title="Dashboard"
        description="Theo dõi số liệu hôm nay, cảnh báo môi trường và thu hoạch, kế hoạch theo tháng. Phần dưới là các điểm vào nhanh theo nhóm công việc."
      />
      <SupabaseConfigBanner />
      <WorkflowStartStrip />
      {configured ? <DashboardOverview /> : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.035] dark:border-slate-800 dark:bg-slate-950 dark:ring-white/[0.05]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/95 to-white px-6 py-5 dark:border-slate-800 dark:from-slate-900/90 dark:to-slate-950">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">Điểm vào nhanh</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Cùng nội dung với menu bên trái — gom theo việc bạn đang làm (ao, báo cáo, cài đặt).
          </p>
        </div>
        <div className="space-y-10 px-6 py-8">
          {overviewTileGroups.map((group) => (
            <div key={group.id}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{group.title}</h3>
              {group.subtitle ? (
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {group.subtitle}
                </p>
              ) : null}
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.tiles.map((tile) => (
                  <li key={tile.href}>
                    <Link
                      href={tile.href}
                      className="group flex h-full min-h-[8.5rem] flex-col rounded-xl border border-slate-200/90 bg-slate-50/30 p-5 transition hover:border-[var(--app-accent)]/35 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-[var(--app-accent)]/40 dark:hover:bg-slate-900/60"
                    >
                      <span className="text-base font-semibold tracking-tight text-slate-900 group-hover:text-[var(--app-accent)] dark:text-slate-50">
                        {tile.title}
                      </span>
                      <span className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {tile.description}
                      </span>
                      <span className="mt-4 text-sm font-semibold text-[var(--app-accent)] underline-offset-2 group-hover:underline">
                        Mở
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
