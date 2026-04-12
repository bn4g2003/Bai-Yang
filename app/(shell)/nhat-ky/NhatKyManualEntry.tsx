"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import { extractQrToken } from "@/lib/qr-token";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

type PondPick = {
  qr_token: string;
  pond_code: string;
  owner_name: string;
};

export function NhatKyManualEntry() {
  const router = useRouter();
  const configured = supabaseConfigured();
  const [manual, setManual] = useState("");
  const [pickToken, setPickToken] = useState("");
  const [ponds, setPonds] = useState<PondPick[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPonds = useCallback(async () => {
    if (!configured) return;
    setLoadingList(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("ponds")
      .select("qr_token, pond_code, owner_name")
      .order("pond_code");
    setLoadingList(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setPonds((data ?? []) as PondPick[]);
  }, [configured]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPonds();
    });
  }, [loadPonds]);

  const resolveAndGo = async (raw: string, fromSelect?: string) => {
    setErr(null);
    const trimmed = raw.trim();
    const directToken = (fromSelect ?? "").trim() || extractQrToken(trimmed);

    if (directToken) {
      router.push(`/nhat-ky/${directToken}`);
      return;
    }

    if (!trimmed) {
      setErr("Nhập URL, mã token (UUID) hoặc mã ao.");
      return;
    }

    if (!configured) {
      setErr(
        "Không nhận dạng được token. Dán đúng link /nhat-ky/… hoặc UUID; tra theo mã ao cần cấu hình Supabase.",
      );
      return;
    }

    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("ponds")
      .select("qr_token")
      .eq("pond_code", trimmed)
      .maybeSingle();
    setBusy(false);

    if (error) {
      setErr(error.message);
      return;
    }
    const row = data as { qr_token: string } | null;
    if (!row?.qr_token) {
      setErr("Không tìm thấy ao với mã này. Kiểm tra dấu cách hoặc dán URL / UUID.");
      return;
    }
    router.push(`/nhat-ky/${row.qr_token}`);
  };

  const onSubmitManual = (e: FormEvent) => {
    e.preventDefault();
    void resolveAndGo(manual);
  };

  const onOpenFromSelect = () => {
    if (!pickToken) {
      setErr("Chọn một ao trong danh sách.");
      return;
    }
    void resolveAndGo("", pickToken);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Nhập / dán</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Dán link nhật ký, chỉ UUID (<code className="rounded bg-slate-100 px-0.5 dark:bg-slate-800">qr_token</code>
          ), hoặc gõ đúng <strong className="font-medium text-slate-700 dark:text-slate-300">mã ao</strong> (vd.{" "}
          <span className="font-mono">17 03 006 04</span>) nếu đã kết nối Supabase.
        </p>
        <form onSubmit={onSubmitManual} className="mt-4 space-y-3">
          <label className="block">
            <span className={labelClass}>Nội dung</span>
            <input
              className={`${inputClass} mt-1 font-mono text-sm`}
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="URL, UUID hoặc mã ao"
              autoComplete="off"
            />
          </label>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Đang kiểm tra…" : "Mở nhật ký"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chọn ao</h2>
        {!configured ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Khi đã cấu hình Supabase, danh sách ao sẽ hiện ở đây. Xem{" "}
            <Link href="/vung-nuoi" className="font-medium text-[var(--app-accent)] underline">
              Quản lý vùng nuôi
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Chọn ao rồi mở form nhập liệu.
            </p>
            {loadingList ? (
              <p className="mt-3 text-sm text-slate-500">Đang tải danh sách…</p>
            ) : ponds.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Chưa có ao — thêm tại{" "}
                <Link href="/vung-nuoi" className="font-medium text-[var(--app-accent)] underline">
                  Quản lý vùng nuôi
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block min-w-0 flex-1">
                  <span className={labelClass}>Ao</span>
                  <select
                    className={`${inputClass} mt-1`}
                    value={pickToken}
                    onChange={(e) => setPickToken(e.target.value)}
                  >
                    <option value="">— Chọn mã ao —</option>
                    {ponds.map((p) => (
                      <option key={p.qr_token} value={p.qr_token}>
                        {p.pond_code} — {p.owner_name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className={btnSecondary} onClick={onOpenFromSelect}>
                  Mở nhật ký
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {err ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {err}
        </p>
      ) : null}
    </div>
  );
}
