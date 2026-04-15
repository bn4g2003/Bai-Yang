"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";

type PresetRow = {
  id: string;
  name: string;
  formula_key: string;
  params: Record<string, unknown>;
  is_default: boolean;
};

const DEFAULT_THRESHOLDS = `{
  "do_min": 4,
  "nh3_max": 0.1,
  "ph_min": 6.5,
  "ph_max": 8.5,
  "temp_min": 26,
  "temp_max": 34
}`;

export function SettingsScreen() {
  const [jsonText, setJsonText] = useState(DEFAULT_THRESHOLDS);
  const [presets, setPresets] = useState<PresetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setError(null);
    const [setRes, preRes] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "env_thresholds").maybeSingle(),
      supabase.from("calculation_presets").select("*").order("created_at", { ascending: false }),
    ]);
    if (setRes.data?.value != null) {
      setJsonText(JSON.stringify(setRes.data.value, null, 2));
    }
    if (preRes.error) setError(preRes.error.message);
    else setPresets((preRes.data ?? []) as PresetRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const saveThresholds = async () => {
    if (!supabaseConfigured()) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("JSON không hợp lệ.");
      setSaving(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error: upErr } = await supabase
      .from("app_settings")
      .upsert({ key: "env_thresholds", value: parsed as Record<string, unknown> });
    setSaving(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setMessage("Đã lưu ngưỡng môi trường.");
  };

  if (!supabaseConfigured()) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-950 dark:ring-white/[0.04]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Ngưỡng cảnh báo môi trường</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Dùng bởi view <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">v_env_alerts_latest</code> trên
          Dashboard. Thêm <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">temp_min</code> /{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">temp_max</code> (°C) để cảnh báo nhiệt độ.
        </p>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Đang tải…</p>
        ) : (
          <textarea
            className="mt-4 w-full min-h-[180px] rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900/80"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
        )}
        {error ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
        ) : null}
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void saveThresholds()}
          className="mt-3 rounded-lg bg-[var(--app-accent,#2563eb)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Lưu ngưỡng"}
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-950 dark:ring-white/[0.04]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Công thức tính toán (preset)</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Bảng <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">calculation_presets</code> — có thể bổ
          sung CRUD sau; hiện chỉ đọc danh sách.
        </p>
        {presets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Chưa có preset. Chèn mẫu qua SQL:{" "}
            <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">
              INSERT INTO calculation_presets (name, formula_key, params) VALUES (...)
            </code>
          </p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {presets.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <span className="font-medium text-slate-900 dark:text-slate-50">{p.name}</span>
                <span className="text-slate-500"> · {p.formula_key}</span>
                {p.is_default ? (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                    Mặc định
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-950 dark:ring-white/[0.04]">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">User &amp; phân quyền</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Quản lý tài khoản và role trên Supabase Auth + bảng{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">profiles</code> (xem{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">database/schema.sql</code>). Giai đoạn
          prototype đang mở RLS cho <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">anon</code> — nên
          tắt hoặc thu hẹp trước khi go-live.
        </p>
      </section>
    </div>
  );
}
