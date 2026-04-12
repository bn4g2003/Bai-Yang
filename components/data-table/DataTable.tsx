"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { exportCsv, parseCsv } from "@/lib/csv";
import type { DataTableColumn, DataTableRowSelection } from "./types";

type Props<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  title?: string;
  globalSearchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  /** Cột chọn nhiều dòng (checkbox); state do trang cha giữ để gắn thao tác hàng loạt */
  rowSelection?: DataTableRowSelection;
  renderActions?: (row: T) => ReactNode;
  /** map từ CSV header -> field để import (theo thứ tự cột export) */
  importRow?: (cells: string[]) => T | null;
  exportHeaders?: string[];
  exportRow?: (row: T) => string[];
};

function useFilterOptions<T>(columns: DataTableColumn<T>[], data: T[]) {
  return useMemo(() => {
    const initial: Record<string, Set<string>> = {};
    for (const c of columns) {
      if (
        (c.headerFilter !== "multiselect" && c.headerFilter !== "select") ||
        !c.getFilterValue
      ) {
        continue;
      }
      if (c.selectOptions?.length) {
        initial[c.id] = new Set(c.selectOptions.map((s) => s.trim()).filter(Boolean));
        continue;
      }
      const set = new Set<string>();
      for (const row of data) {
        const v = (c.getFilterValue(row) ?? "").trim();
        if (v) set.add(v);
      }
      initial[c.id] = set;
    }
    return initial;
  }, [columns, data]);
}

function GearIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  title,
  globalSearchPlaceholder = "Tìm kiếm…",
  onAdd,
  addLabel = "Thêm",
  rowSelection,
  renderActions,
  importRow,
  exportHeaders,
  exportRow,
}: Props<T>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const headerSelectAllRef = useRef<HTMLInputElement>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    const v: Record<string, boolean> = {};
    for (const c of columns) v[c.id] = !c.defaultHidden;
    return v;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [columnText, setColumnText] = useState<Record<string, string>>({});
  const [columnSelect, setColumnSelect] = useState<Record<string, string>>({});
  /** Tập giá trị được giữ lại; undefined = chưa chỉnh (coi như chọn hết) */
  const [multiIncluded, setMultiIncluded] = useState<Record<string, Set<string>>>({});
  const filterOptions = useFilterOptions(columns, data);

  const setText = useCallback((id: string, v: string) => {
    setColumnText((prev) => ({ ...prev, [id]: v }));
  }, []);

  const getIncluded = useCallback(
    (colId: string) => multiIncluded[colId] ?? filterOptions[colId] ?? new Set<string>(),
    [multiIncluded, filterOptions],
  );

  const setMultiAll = useCallback((colId: string) => {
    setMultiIncluded((prev) => {
      const next = { ...prev };
      delete next[colId];
      return next;
    });
  }, []);

  const toggleMultiValue = useCallback(
    (colId: string, value: string, checked: boolean) => {
      const all = filterOptions[colId];
      if (!all) return;
      setMultiIncluded((prev) => {
        const current = prev[colId] ?? new Set(all);
        const nextSet = new Set(current);
        if (checked) nextSet.add(value);
        else nextSet.delete(value);
        if (nextSet.size === all.size) {
          const rest = { ...prev };
          delete rest[colId];
          return rest;
        }
        return { ...prev, [colId]: nextSet };
      });
    },
    [filterOptions],
  );

  const visibleColumns = useMemo(
    () => columns.filter((c) => visible[c.id] !== false),
    [columns, visible],
  );

  const filtered = useMemo(() => {
    const g = globalSearch.trim().toLowerCase();
    return data.filter((row) => {
      if (g) {
        const hay = columns
          .filter((c) => c.getSearchText)
          .map((c) => (c.getSearchText!(row) ?? "").toLowerCase())
          .join(" ");
        if (!hay.includes(g)) return false;
      }
      for (const c of columns) {
        if (c.headerFilter === "text") {
          const q = (columnText[c.id] ?? "").trim().toLowerCase();
          if (!q) continue;
          const val = (c.getSearchText?.(row) ?? c.getFilterValue?.(row) ?? "").toLowerCase();
          if (!val.includes(q)) return false;
        }
        if (c.headerFilter === "select" && c.getFilterValue) {
          const sel = (columnSelect[c.id] ?? "").trim();
          if (!sel) continue;
          const cell = (c.getFilterValue(row) ?? "").trim();
          if (cell !== sel) return false;
        }
        if (c.headerFilter === "multiselect" && c.getFilterValue) {
          const all = filterOptions[c.id];
          if (!all || all.size === 0) continue;
          const inc = multiIncluded[c.id] ?? all;
          if (inc.size === 0) return false;
          const cell = (c.getFilterValue(row) ?? "").trim();
          if (!inc.has(cell)) return false;
        }
      }
      return true;
    });
  }, [data, columns, globalSearch, columnText, columnSelect, multiIncluded, filterOptions]);

  const filteredIds = useMemo(() => filtered.map(getRowId), [filtered, getRowId]);

  const selectedIds = rowSelection?.selectedIds;
  const onSelectedIdsChange = rowSelection?.onSelectedIdsChange;

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds?.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds?.has(id));

  useEffect(() => {
    const el = headerSelectAllRef.current;
    if (!el || !rowSelection) return;
    el.indeterminate = someFilteredSelected && !allFilteredSelected;
  }, [rowSelection, someFilteredSelected, allFilteredSelected]);

  const toggleSelectAllFiltered = useCallback(() => {
    if (!onSelectedIdsChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      for (const id of filteredIds) next.delete(id);
    } else {
      for (const id of filteredIds) next.add(id);
    }
    onSelectedIdsChange(next);
  }, [onSelectedIdsChange, selectedIds, allFilteredSelected, filteredIds]);

  const toggleRowSelected = useCallback(
    (id: string, checked: boolean) => {
      if (!onSelectedIdsChange || !selectedIds) return;
      const next = new Set(selectedIds);
      if (checked) next.add(id);
      else next.delete(id);
      onSelectedIdsChange(next);
    },
    [onSelectedIdsChange, selectedIds],
  );

  const handleExport = useCallback(() => {
    if (!exportHeaders || !exportRow) return;
    const rows = filtered.map(exportRow);
    exportCsv("export", exportHeaders, rows);
  }, [exportHeaders, exportRow, filtered]);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !importRow) return;
      const text = await f.text();
      const { rows } = parseCsv(text);
      for (const cells of rows) {
        importRow(cells);
      }
    },
    [importRow],
  );

  const recordLabel =
    data.length === filtered.length
      ? `${filtered.length.toLocaleString("vi-VN")} bản ghi`
      : `${filtered.length.toLocaleString("vi-VN")} / ${data.length.toLocaleString("vi-VN")} bản ghi`;

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      {title ? (
        <h2 className="border-b border-slate-100 px-4 py-3 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
          {title}
        </h2>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-zinc-100 p-4 dark:border-zinc-800 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <label className="sr-only" htmlFor="data-table-global-search">
            Tìm kiếm trong bảng
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              id="data-table-global-search"
              type="search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder={globalSearchPlaceholder}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {recordLabel}
            {rowSelection && selectedIds && selectedIds.size > 0 ? (
              <span className="ml-2 normal-case text-[var(--app-accent,#2563eb)]">
                · Đã chọn {selectedIds.size}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {importRow ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportFile}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Nhập Excel/CSV
              </button>
            </>
          ) : null}
          {exportHeaders && exportRow ? (
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Xuất Excel/CSV
            </button>
          ) : null}
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-lg bg-[var(--app-accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              + {addLabel}
            </button>
          ) : null}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-expanded={settingsOpen}
              aria-label="Cài đặt cột hiển thị"
              title="Cột hiển thị"
            >
              <GearIcon />
            </button>
            {settingsOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default bg-transparent"
                  aria-label="Đóng"
                  onClick={() => setSettingsOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="mb-2 px-1 text-xs font-medium text-zinc-500">Chọn cột</p>
                  <ul className="max-h-64 space-y-1 overflow-y-auto">
                    {columns.map((c) => (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          <input
                            type="checkbox"
                            checked={visible[c.id] !== false}
                            onChange={(e) =>
                              setVisible((v) => ({ ...v, [c.id]: e.target.checked }))
                            }
                          />
                          {c.header}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Desktop / tablet: bảng cuộn ngang */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              {rowSelection ? (
                <th className="sticky left-0 z-20 w-10 min-w-[2.5rem] bg-zinc-50 px-2 py-2 align-middle dark:bg-zinc-900/95">
                  <input
                    ref={headerSelectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="h-4 w-4 rounded border-zinc-300"
                    aria-label="Chọn tất cả dòng đang lọc"
                  />
                </th>
              ) : null}
              {visibleColumns.map((c) => (
                <th
                  key={c.id}
                  className="min-w-[8rem] whitespace-nowrap px-3 py-2 align-top font-semibold text-zinc-800 dark:text-zinc-100"
                >
                  <div className="flex flex-col gap-1.5">
                    <span>{c.header}</span>
                    {c.headerFilter === "text" ? (
                      <input
                        type="search"
                        value={columnText[c.id] ?? ""}
                        onChange={(e) => setText(c.id, e.target.value)}
                        placeholder="Lọc…"
                        className="w-full min-w-[6rem] rounded border border-zinc-200 px-1.5 py-1 text-xs font-normal dark:border-zinc-600 dark:bg-zinc-900"
                      />
                    ) : null}
                    {c.headerFilter === "select" && c.getFilterValue ? (
                      <select
                        value={columnSelect[c.id] ?? ""}
                        onChange={(e) =>
                          setColumnSelect((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        className="w-full min-w-[6rem] rounded border border-zinc-200 px-1 py-1 text-xs font-normal dark:border-zinc-600 dark:bg-zinc-900"
                        aria-label={`Lọc ${c.header}`}
                      >
                        <option value="">{c.selectAllLabel ?? "Tất cả"}</option>
                        {[...(filterOptions[c.id] ?? [])].sort().map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {c.headerFilter === "multiselect" && c.getFilterValue ? (
                      <details className="relative font-normal">
                        <summary className="cursor-pointer list-none rounded border border-zinc-200 px-1.5 py-1 text-xs dark:border-zinc-600">
                          Lọc giá trị
                        </summary>
                        <div className="absolute left-0 z-30 mt-1 max-h-48 min-w-[10rem] overflow-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                          <div className="mb-2">
                            <button
                              type="button"
                              className="text-xs text-[var(--app-accent,#2563eb)] hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                setMultiAll(c.id);
                              }}
                            >
                              Chọn tất cả
                            </button>
                          </div>
                          {[...(filterOptions[c.id] ?? [])].sort().map((opt) => {
                            const inc = getIncluded(c.id);
                            const checked = inc.has(opt);
                            return (
                              <label
                                key={opt}
                                className="flex cursor-pointer items-center gap-2 py-0.5 text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => toggleMultiValue(c.id, opt, e.target.checked)}
                                />
                                <span className="truncate">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </details>
                    ) : null}
                  </div>
                </th>
              ))}
              {renderActions ? (
                <th className="sticky right-0 z-20 min-w-[7rem] bg-zinc-50 px-3 py-2 font-semibold shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.2)] dark:bg-zinc-900/95">
                  Thao tác
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const id = getRowId(row);
              return (
                <tr
                  key={id}
                  className="border-b border-zinc-100 dark:border-zinc-800/80"
                >
                  {rowSelection ? (
                    <td className="sticky left-0 z-10 bg-white px-2 py-2 align-middle dark:bg-zinc-950">
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(id) ?? false}
                        onChange={(e) => toggleRowSelected(id, e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300"
                        aria-label={`Chọn dòng ${id}`}
                      />
                    </td>
                  ) : null}
                  {visibleColumns.map((c) => (
                    <td key={c.id} className="px-3 py-2 align-middle text-zinc-800 dark:text-zinc-200">
                      {c.cell(row)}
                    </td>
                  ))}
                  {renderActions ? (
                    <td className="sticky right-0 z-10 bg-white px-3 py-2 align-middle shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.15)] dark:bg-zinc-950">
                      <div className="flex flex-wrap gap-1">{renderActions(row)}</div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: thẻ */}
      <div className="space-y-3 p-4 md:hidden">
        {filtered.map((row) => {
          const id = getRowId(row);
          return (
            <article
              key={id}
              className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/40"
            >
              {rowSelection ? (
                <label className="mb-3 flex cursor-pointer items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(id) ?? false}
                    onChange={(e) => toggleRowSelected(id, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Chọn dòng này
                  </span>
                </label>
              ) : null}
              <dl className="space-y-2">
                {visibleColumns.map((c) => (
                  <div key={c.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{c.header}</dt>
                    <dd className="text-sm text-zinc-900 dark:text-zinc-100">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
              {renderActions ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  {renderActions(row)}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500 md:border-t md:border-zinc-100 dark:border-zinc-800">
          Không có dòng nào khớp bộ lọc.
        </p>
      ) : null}
    </section>
  );
}
