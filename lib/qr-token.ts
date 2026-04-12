/** Trích token nhật ký từ text quét được (URL đầy đủ hoặc chỉ UUID). */
const UUID_IN_TEXT =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractQrToken(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;

  const pathMatch = t.match(/\/nhat-ky\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch {
      return pathMatch[1];
    }
  }

  const uuidMatch = t.match(UUID_IN_TEXT);
  if (uuidMatch) return uuidMatch[0];

  return null;
}
