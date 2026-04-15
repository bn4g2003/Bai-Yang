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

/** Xuất PDF bảng (ngang A4). */
export function downloadPdfTable(fileBase: string, title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(12);
  doc.text(title, 40, 40);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 52,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 36, right: 36 },
    tableWidth: "auto",
  });
  const base = fileBase.replace(/\.pdf$/i, "");
  doc.save(`${base}.pdf`);
}
