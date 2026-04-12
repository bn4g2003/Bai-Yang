"use client";

import { supabaseConfigured } from "@/lib/supabase/client";

export function SupabaseConfigBanner() {
  if (supabaseConfigured()) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      Chưa cấu hình Supabase: thêm{" "}
      <code className="rounded bg-amber-200/80 px-1 dark:bg-amber-900/60">
        NEXT_PUBLIC_SUPABASE_URL
      </code>{" "}
      và{" "}
      <code className="rounded bg-amber-200/80 px-1 dark:bg-amber-900/60">
        NEXT_PUBLIC_SUPABASE_ANON_KEY
      </code>{" "}
      vào <code className="rounded bg-amber-200/80 px-1 dark:bg-amber-900/60">.env</code>, rồi chạy
      SQL trong <code className="rounded bg-amber-200/80 px-1 dark:bg-amber-900/60">database/schema.sql</code>.
    </div>
  );
}
