"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { extractQrToken } from "@/lib/qr-token";
import { btnGhost, btnSecondary, modalBackdrop, modalPanel } from "@/lib/ui";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function QrScanModal({ open, onClose }: Props) {
  const router = useRouter();
  const reactId = useId().replace(/:/g, "");
  const readerId = `qr-reader-${reactId}`;
  const html5Ref = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const stopScanner = useCallback(async () => {
    const h = html5Ref.current;
    html5Ref.current = null;
    if (!h) return;
    try {
      await h.stop();
    } catch {
      /* đã dừng */
    }
    try {
      h.clear();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) {
      void stopScanner();
      setErr(null);
      setHint(null);
      return;
    }

    let cancelled = false;
    setStarting(true);
    setErr(null);
    setHint("Đang mở camera…");

    const run = async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled) return;

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const el = document.getElementById(readerId);
        if (!el) {
          setErr("Không tìm thấy vùng hiển thị camera.");
          setStarting(false);
          setHint(null);
          return;
        }

        const html5 = new Html5Qrcode(readerId, { verbose: false });
        html5Ref.current = html5;

        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;

        if (!cameras.length) {
          setErr("Không có camera. Dùng điện thoại quét QR hoặc tải ảnh mã.");
          setStarting(false);
          setHint(null);
          return;
        }

        const back =
          cameras.find((c) => /back|rear|environment|sau/i.test(c.label)) ?? cameras[0];

        await html5.start(
          back.id,
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            const token = extractQrToken(decodedText);
            if (!token) {
              setHint("Đã quét nhưng không nhận diện link nhật ký.");
              return;
            }
            void (async () => {
              await stopScanner();
              onCloseRef.current();
              router.push(`/nhat-ky/${token}`);
            })();
          },
          () => {
            /* frame không có mã — bỏ qua */
          },
        );

        if (!cancelled) {
          setHint("Đưa mã QR vào khung — hệ thống tự mở nhật ký ao.");
          setStarting(false);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Không mở được camera (kiểm tra quyền trình duyệt).");
          setStarting(false);
          setHint(null);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, readerId, router, stopScanner]);

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    await stopScanner();
    await new Promise((r) => setTimeout(r, 200));
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5 = new Html5Qrcode(readerId, { verbose: false });
      const res = await html5.scanFile(file, false);
      const token = extractQrToken(res);
      html5.clear();
      if (!token) {
        setErr("Ảnh không chứa mã nhật ký hợp lệ.");
        return;
      }
      onClose();
      router.push(`/nhat-ky/${token}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không đọc được ảnh.");
    }
  };

  if (!open) return null;

  return (
    <div className={modalBackdrop} role="presentation">
      <div
        className={`${modalPanel} max-w-md`}
        role="dialog"
        aria-modal
        aria-labelledby={`${readerId}-title`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 id={`${readerId}-title`} className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Quét QR nhật ký
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Quét mã dán tại ao — mở form nhập liệu để lưu lên hệ thống.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đóng"
            onClick={() => {
              void stopScanner();
              onClose();
            }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {err ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {err}
          </p>
        ) : null}
        {hint && !err ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}

        <div
          id={readerId}
          className={`mt-4 min-h-[260px] overflow-hidden rounded-lg border border-slate-200 bg-black/5 dark:border-slate-700 dark:bg-black/20 ${starting ? "animate-pulse" : ""}`}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <label className={btnSecondary + " cursor-pointer"}>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onPickFile(e)} />
            Chọn ảnh QR
          </label>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              void stopScanner();
              onClose();
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
