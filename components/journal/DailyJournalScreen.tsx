"use client";

import { useCallback, useEffect, useState, type HTMLAttributes } from "react";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import type { DailyPondLogInsert, PondRow } from "@/lib/types/pond";

type TabId = "care" | "env" | "fish";

const tabs: { id: TabId; label: string }[] = [
  { id: "care", label: "Chăm sóc" },
  { id: "env", label: "Môi trường" },
  { id: "fish", label: "Tình trạng cá" },
];

export function DailyJournalScreen({ token }: { token: string }) {
  const [pond, setPond] = useState<PondRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("care");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [logDate, setLogDate] = useState(today);

  const [care, setCare] = useState({
    feed_type: "",
    feed_kg: "",
    probiotic: "",
    vitamin: "",
    medicine: "",
    chemicals: "",
  });
  const [env, setEnv] = useState({
    temp_c: "",
    ph: "",
    clarity_cm: "",
    water_color: "",
    no2: "",
    nh3: "",
    do_mg_l: "",
    h2s: "",
  });
  const [fish, setFish] = useState({
    dead_loss_count: "",
    remaining_fish_count: "",
    sample_avg_g_per_fish: "",
    disease_signs: "",
    treatment: "",
  });

  const loadPond = useCallback(async () => {
    if (!supabaseConfigured()) {
      setLoading(false);
      setError("Chưa cấu hình Supabase.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { data, error: qErr } = await supabase
      .from("ponds")
      .select("*")
      .eq("qr_token", token)
      .maybeSingle();
    setLoading(false);
    if (qErr) {
      setError(qErr.message);
      return;
    }
    if (!data) {
      setError("Không tìm thấy ao với mã QR này.");
      return;
    }
    const row = data as PondRow;
    setPond(row);
    setFish((f) => ({
      ...f,
      remaining_fish_count:
        row.estimated_fish_count != null ? String(row.estimated_fish_count) : "",
    }));
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPond();
    });
  }, [loadPond]);

  const parseNum = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const parseIntSafe = (s: string) => {
    const t = s.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    if (!pond || !supabaseConfigured()) return;
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const supabase = createSupabaseBrowserClient();
    const row: DailyPondLogInsert = {
      pond_id: pond.id,
      log_date: logDate,
      feed_type: care.feed_type.trim() || null,
      feed_kg: parseNum(care.feed_kg),
      probiotic: care.probiotic.trim() || null,
      vitamin: care.vitamin.trim() || null,
      medicine: care.medicine.trim() || null,
      chemicals: care.chemicals.trim() || null,
      temp_c: parseNum(env.temp_c),
      ph: parseNum(env.ph),
      clarity_cm: parseNum(env.clarity_cm),
      water_color: env.water_color.trim() || null,
      no2: parseNum(env.no2),
      nh3: parseNum(env.nh3),
      do_mg_l: parseNum(env.do_mg_l),
      h2s: parseNum(env.h2s),
      dead_loss_count: parseIntSafe(fish.dead_loss_count),
      remaining_fish_count: parseIntSafe(fish.remaining_fish_count),
      sample_avg_g_per_fish: parseNum(fish.sample_avg_g_per_fish),
      disease_signs: fish.disease_signs.trim() || null,
      treatment: fish.treatment.trim() || null,
    };
    const { error: insErr } = await supabase.from("daily_pond_logs").insert(row);
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setSavedAt(new Date().toLocaleString("vi-VN"));

    const sampleG = parseNum(fish.sample_avg_g_per_fish);
    const remaining = parseIntSafe(fish.remaining_fish_count);
    const patch: Record<string, unknown> = {};
    if (sampleG != null) {
      patch.current_avg_weight_kg = sampleG / 1000;
    }
    if (remaining != null) {
      patch.estimated_fish_count = remaining;
      const wKg =
        sampleG != null ? sampleG / 1000 : pond.current_avg_weight_kg != null ? pond.current_avg_weight_kg : null;
      if (wKg != null && wKg > 0) {
        patch.current_biomass_t = (remaining * wKg) / 1000;
      }
    }
    if (Object.keys(patch).length > 0) {
      await supabase.from("ponds").update(patch).eq("id", pond.id);
      setPond((prev) => (prev ? { ...prev, ...patch } as PondRow : prev));
    }
  };

  if (!supabaseConfigured()) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-100">
        Cấu hình Supabase trong .env để dùng nhật ký.
      </p>
    );
  }

  if (loading) {
    return <p className="text-center text-sm text-zinc-500">Đang mở ao…</p>;
  }

  if (error && !pond) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
        {error}
      </div>
    );
  }

  if (!pond) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 pb-24">
      <header className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Nhật ký ao</p>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{pond.pond_code}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{pond.owner_name}</p>
        <label className="mt-3 block text-sm">
          <span className="text-zinc-500">Ngày ghi nhận</span>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-base dark:border-zinc-700 dark:bg-zinc-900"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
          />
        </label>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          {error}
        </p>
      ) : null}
      {savedAt ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          Đã lưu lúc {savedAt} (kèm timestamp trên server).
        </p>
      ) : null}

      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/80">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {tab === "care" ? (
          <div className="space-y-3">
            <Field
              label="Loại thức ăn"
              value={care.feed_type}
              onChange={(v) => setCare((c) => ({ ...c, feed_type: v }))}
            />
            <Field
              label="Lượng thức ăn (kg)"
              value={care.feed_kg}
              onChange={(v) => setCare((c) => ({ ...c, feed_kg: v }))}
              inputMode="decimal"
            />
            <Field
              label="Men tiêu hóa"
              value={care.probiotic}
              onChange={(v) => setCare((c) => ({ ...c, probiotic: v }))}
            />
            <Field
              label="Vitamin"
              value={care.vitamin}
              onChange={(v) => setCare((c) => ({ ...c, vitamin: v }))}
            />
            <Field
              label="Thuốc"
              value={care.medicine}
              onChange={(v) => setCare((c) => ({ ...c, medicine: v }))}
            />
            <Field
              label="Hóa chất"
              value={care.chemicals}
              onChange={(v) => setCare((c) => ({ ...c, chemicals: v }))}
            />
          </div>
        ) : null}

        {tab === "env" ? (
          <div className="space-y-3">
            <Field
              label="Nhiệt độ (°C)"
              value={env.temp_c}
              onChange={(v) => setEnv((c) => ({ ...c, temp_c: v }))}
              inputMode="decimal"
            />
            <Field
              label="pH"
              value={env.ph}
              onChange={(v) => setEnv((c) => ({ ...c, ph: v }))}
              inputMode="decimal"
            />
            <Field
              label="Độ trong (cm)"
              value={env.clarity_cm}
              onChange={(v) => setEnv((c) => ({ ...c, clarity_cm: v }))}
              inputMode="decimal"
            />
            <Field
              label="Màu nước"
              value={env.water_color}
              onChange={(v) => setEnv((c) => ({ ...c, water_color: v }))}
            />
            <Field
              label="NO2"
              value={env.no2}
              onChange={(v) => setEnv((c) => ({ ...c, no2: v }))}
              inputMode="decimal"
            />
            <Field
              label="NH3"
              value={env.nh3}
              onChange={(v) => setEnv((c) => ({ ...c, nh3: v }))}
              inputMode="decimal"
            />
            <Field
              label="DO"
              value={env.do_mg_l}
              onChange={(v) => setEnv((c) => ({ ...c, do_mg_l: v }))}
              inputMode="decimal"
            />
            <Field
              label="H2S"
              value={env.h2s}
              onChange={(v) => setEnv((c) => ({ ...c, h2s: v }))}
              inputMode="decimal"
            />
          </div>
        ) : null}

        {tab === "fish" ? (
          <div className="space-y-3">
            <Field
              label="Số cá còn tồn (con)"
              value={fish.remaining_fish_count}
              onChange={(v) => setFish((c) => ({ ...c, remaining_fish_count: v }))}
              inputMode="numeric"
            />
            <Field
              label="Số cá chết / hao hụt"
              value={fish.dead_loss_count}
              onChange={(v) => setFish((c) => ({ ...c, dead_loss_count: v }))}
              inputMode="numeric"
            />
            <Field
              label="Cân mẫu TB (g/con)"
              value={fish.sample_avg_g_per_fish}
              onChange={(v) => setFish((c) => ({ ...c, sample_avg_g_per_fish: v }))}
              inputMode="decimal"
            />
            <AreaField
              label="Dấu hiệu bệnh"
              value={fish.disease_signs}
              onChange={(v) => setFish((c) => ({ ...c, disease_signs: v }))}
            />
            <AreaField
              label="Biện pháp xử lý"
              value={fish.treatment}
              onChange={(v) => setFish((c) => ({ ...c, treatment: v }))}
            />
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="w-full rounded-xl bg-[var(--app-accent,#2563eb)] py-3.5 text-base font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : "Lưu nhật ký"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <input
        inputMode={inputMode}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-base dark:border-zinc-700 dark:bg-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function AreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <textarea
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-base dark:border-zinc-700 dark:bg-zinc-900"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
