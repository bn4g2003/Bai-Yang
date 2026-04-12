/** Xuất/nhập tương thích Excel: CSV có BOM UTF-8 */

export function exportCsv(filename: string, headers: string[], rows: string[][]): void {
  const esc = (cell: string) => {
    const s = String(cell ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (c === "\n" || (c === "\r" && text[i + 1] === "\n"))) {
      if (c === "\r") i++;
      lines.push(cur);
      cur = "";
      continue;
    }
    if (!inQuotes && c === "\r") {
      lines.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.length || text.endsWith("\n")) lines.push(cur);

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cell = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = !q;
        continue;
      }
      if (!q && ch === ",") {
        out.push(cell);
        cell = "";
        continue;
      }
      cell += ch;
    }
    out.push(cell);
    return out;
  };

  const trimmed = lines.map((l) => l.replace(/^\uFEFF/, "")).filter((l) => l.length);
  if (!trimmed.length) return { headers: [], rows: [] };
  const headers = splitLine(trimmed[0]).map((h) => h.trim());
  const rows = trimmed.slice(1).map(splitLine);
  return { headers, rows };
}
