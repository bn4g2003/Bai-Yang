"use client";

import { useState } from "react";
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
  const [pdfBusy, setPdfBusy] = useState(false);

  const run = async (kind: "xlsx" | "pdf") => {
    const rows = getRows();
    if (kind === "xlsx") {
      downloadXlsx(fileBase, sheetName ?? "Bao cao", headers, rows);
      return;
    }
    setPdfBusy(true);
    try {
      await downloadPdfTable(fileBase, title, headers, rows);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Xuất file</span>
      <button type="button" disabled={disabled} className={btnSecondary + " !py-1.5 !text-xs"} onClick={() => void run("xlsx")}>
        Excel (.xlsx)
      </button>
      <button
        type="button"
        disabled={disabled || pdfBusy}
        className={btnSecondary + " !py-1.5 !text-xs"}
        onClick={() => void run("pdf")}
      >
        {pdfBusy ? "PDF…" : "PDF"}
      </button>
    </div>
  );
}
