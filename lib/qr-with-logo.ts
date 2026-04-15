import QRCode from "qrcode";

export type QrWithLogoOptions = {
  /** Cạnh QR (px), mặc định 320 */
  size?: number;
  margin?: number;
  /** Đường dẫn logo (public), mặc định /logo.png */
  logoUrl?: string;
  /** Tỷ lệ cạnh logo so với cạnh QR (0–1), mặc định 0.2 */
  logoScale?: number;
};

/**
 * Tạo data URL PNG: QR (mức sửa lỗi H) + logo ở giữa.
 * Nếu không tải được logo hoặc canvas lỗi → QR thuần (toDataURL, vẫn dùng H).
 */
export async function qrDataUrlWithLogo(text: string, options: QrWithLogoOptions = {}): Promise<string> {
  const size = options.size ?? 320;
  const margin = options.margin ?? 2;
  const logoUrl = options.logoUrl ?? "/logo.png";
  const logoScale = options.logoScale ?? 0.2;
  const qrOpts = {
    width: size,
    margin,
    errorCorrectionLevel: "H" as const,
    color: { dark: "#000000", light: "#ffffff" },
  };

  if (typeof document === "undefined") {
    return QRCode.toDataURL(text, qrOpts);
  }

  const canvas = document.createElement("canvas");
  try {
    await QRCode.toCanvas(canvas, text, qrOpts);
  } catch {
    return QRCode.toDataURL(text, qrOpts);
  }

  let logo: HTMLImageElement;
  try {
    logo = await loadImage(logoUrl);
  } catch {
    return canvas.toDataURL("image/png");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas.toDataURL("image/png");
  }

  const w = canvas.width;
  const logoSize = Math.max(16, Math.floor(w * logoScale));
  const pad = Math.max(4, Math.floor(logoSize * 0.1));
  const box = logoSize + pad * 2;
  const x0 = Math.floor((w - box) / 2);
  const y0 = Math.floor((w - box) / 2);

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x0, y0, box, box);
  ctx.drawImage(logo, x0 + pad, y0 + pad, logoSize, logoSize);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load logo: ${src}`));
    img.src = src;
  });
}
