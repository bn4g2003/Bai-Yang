import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/** Xuất Excel (.xlsx) — một sheet, hàng đầu là tiêu đề cột. */
export function downloadXlsx(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  const safeName = sheetName.slice(0, 31).replace(/[[\]:*?/\\]/g, "_") || "Sheet1";
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeName);
  const out = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, out);
}

const NOTO_VFS_NAME = "NotoSans-Regular.ttf";
const NOTO_FAMILY = "NotoSans";

let cachedNotoBinary: string | null = null;

function uint8ToBinaryString(u8: Uint8Array): string {
  const chunk = 0x8000;
  let s = "";
  for (let i = 0; i < u8.length; i += chunk) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + chunk) as unknown as number[]);
  }
  return s;
}

async function loadNotoSansBinary(): Promise<string | null> {
  if (cachedNotoBinary) return cachedNotoBinary;
  try {
    const res = await fetch("/fonts/NotoSans-Regular.ttf");
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    cachedNotoBinary = uint8ToBinaryString(buf);
    return cachedNotoBinary;
  } catch {
    return null;
  }
}

type PdfDocWithVfs = jsPDF & {
  addFileToVFS: (filename: string, fileContent: string) => void;
  addFont: (postScriptName: string, fontName: string, fontStyle: string) => void;
};

function registerNotoOnDoc(doc: jsPDF, binary: string): void {
  const d = doc as PdfDocWithVfs;
  d.addFileToVFS(NOTO_VFS_NAME, binary);
  d.addFont(NOTO_VFS_NAME, NOTO_FAMILY, "normal");
  // autoTable theme “striped” mặc định dùng fontStyle bold cho hàng tiêu đề —
  // nếu không đăng ký bold, jsPDF rơi về Helvetica Bold và chữ Việt hỏng.
  d.addFont(NOTO_VFS_NAME, NOTO_FAMILY, "bold");
}

/** Xuất PDF bảng (ngang A4), font Noto Sans để hiển thị đúng tiếng Việt. */
export async function downloadPdfTable(
  fileBase: string,
  title: string,
  headers: string[],
  rows: (string | number)[][],
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const notoBin = await loadNotoSansBinary();
  const fontFamily = notoBin ? NOTO_FAMILY : "helvetica";
  if (notoBin) {
    registerNotoOnDoc(doc, notoBin);
  }
  doc.setFont(fontFamily, "normal");
  doc.setFontSize(12);
  doc.text(title, 40, 40);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 52,
    styles: { fontSize: 7, cellPadding: 2, font: fontFamily, fontStyle: "normal" },
    headStyles: {
      fillColor: [37, 99, 235],
      font: fontFamily,
      fontStyle: "bold",
      textColor: 255,
    },
    bodyStyles: { font: fontFamily, fontStyle: "normal" },
    margin: { left: 36, right: 36 },
    tableWidth: "auto",
  });
  const base = fileBase.replace(/\.pdf$/i, "");
  doc.save(`${base}.pdf`);
}
