import type { ReactNode } from "react";

/** none: không lọc | text: ô gõ | select: một giá trị | multiselect: nhiều giá trị (checkbox) */
export type ColumnHeaderFilter = "none" | "text" | "select" | "multiselect";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Nội dung dùng cho ô tìm kiếm toàn cục */
  getSearchText?: (row: T) => string;
  /** Bộ lọc trong header cột */
  headerFilter?: ColumnHeaderFilter;
  /** Giá trị dùng cho lọc select / multiselect */
  getFilterValue?: (row: T) => string;
  /** Với headerFilter select: danh sách option cố định; bỏ trống thì suy ra từ dữ liệu */
  selectOptions?: string[];
  /** Nhãn option rỗng (tất cả) cho select */
  selectAllLabel?: string;
  /** Ẩn mặc định trong cài đặt cột */
  defaultHidden?: boolean;
};

export type DataTableRowSelection = {
  selectedIds: Set<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
};
