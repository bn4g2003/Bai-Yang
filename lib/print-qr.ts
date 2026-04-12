function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * In mã QR — dùng iframe (tránh popup bị chặn và onload không chạy trên about:blank).
 */
export function printQrDataUrl(dataUrl: string, title: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;inset:0;width:0;height:0;border:0;opacity:0;pointer-events:none",
  );
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  const safeTitle = escapeHtml(title);
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>
  @page { margin: 12mm; }
  @media print {
    body { margin: 0; }
  }
  body {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  h1 { font-size: 15px; font-weight: 600; margin: 0 0 14px; }
  img { width: 280px; height: 280px; image-rendering: pixelated; }
  p { font-size: 12px; color: #64748b; margin-top: 16px; }
</style></head><body>
<h1>${safeTitle}</h1>
<img src="${dataUrl}" alt="QR ao" width="280" height="280" />
<p>Dán tại ao — in khổ vuông</p>
</body></html>`);
  doc.close();

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      /* ignore */
    }
  };

  const runPrint = () => {
    try {
      win.focus();
      win.print();
    } finally {
      setTimeout(cleanup, 800);
    }
  };

  const img = doc.querySelector("img");
  if (img?.complete && img.naturalWidth > 0) {
    setTimeout(runPrint, 150);
    return;
  }
  img?.addEventListener(
    "load",
    () => {
      setTimeout(runPrint, 150);
    },
    { once: true },
  );
  img?.addEventListener("error", () => cleanup(), { once: true });
  setTimeout(() => {
    if (iframe.isConnected) runPrint();
  }, 800);
}

/** Tải ảnh QR (khi trình duyệt không in được). */
export function downloadQrPng(dataUrl: string, baseName: string) {
  const safe = baseName.replace(/[^\w\s.-]+/g, "_").trim() || "ao";
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${safe}-qr.png`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
