"use client";

import { btnSecondary } from "@/lib/ui";
import { downloadPdfTable, downloadXlsx } from "@/lib/export-report";

type Props = {
  title: string;
  fileBase: string;
  sheetName?: string;
  headers: string[];
  getRows: () => (string | number)[][];
  disabled?: boolean;
};

export function ExportToolbar({ title, fileBase, sheetName, headers, getRows, disabled }: Props) {
  const run = (kind: "xlsx" | "pdf") => {
    const rows = getRows();
    if (kind === "xlsx") {
      downloadXlsx(fileBase, sheetName ?? "Bao cao", headers, rows);
    } else {
      downloadPdfTable(fileBase, title, headers, rows);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Xuất file</span>
      <button type="button" disabled={disabled} className={btnSecondary + " !py-1.5 !text-xs"} onClick={() => run("xlsx")}>
        Excel (.xlsx)
      </button>
      <button type="button" disabled={disabled} className={btnSecondary + " !py-1.5 !text-xs"} onClick={() => run("pdf")}>
        PDF
      </button>
    </div>
  );
}
