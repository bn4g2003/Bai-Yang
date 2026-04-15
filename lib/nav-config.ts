export type NavIconId =
  | "dashboard"
  | "ponds"
  | "journal"
  | "journalHistory"
  | "reportGuide"
  | "reportHarvest"
  | "reportPlanSummary"
  | "reportEnv"
  | "settings"
  | "agents";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconId;
};

export type NavGroup = {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: NavItem[];
};

export const mainNavGroups: NavGroup[] = [
  {
    id: "tong-quan",
    label: "Tổng quan",
    defaultOpen: true,
    items: [{ href: "/", label: "Dashboard", icon: "dashboard" }],
  },
  {
    id: "van-hanh",
    label: "Ao & nhật ký",
    defaultOpen: true,
    items: [
      { href: "/vung-nuoi", label: "Quản lý vùng nuôi", icon: "ponds" },
      { href: "/nhat-ky", label: "Nhập nhật ký (QR)", icon: "journal" },
      { href: "/nhat-ky/lich-su", label: "Lịch sử nhật ký", icon: "journalHistory" },
    ],
  },
  {
    id: "bao-cao",
    label: "Báo cáo",
    defaultOpen: true,
    items: [
      { href: "/bao-cao", label: "Hướng dẫn báo cáo", icon: "reportGuide" },
      { href: "/bao-cao/ke-hoach-thu-hoach", label: "Kế hoạch thu & sản lượng", icon: "reportHarvest" },
      { href: "/bao-cao/tong-hop-ke-hoach", label: "Tổng hợp kế hoạch (đại lý)", icon: "reportPlanSummary" },
      { href: "/bao-cao/moi-truong", label: "Môi trường", icon: "reportEnv" },
    ],
  },
  {
    id: "he-thong",
    label: "Danh mục & cài đặt",
    defaultOpen: false,
    items: [
      { href: "/cai-dat", label: "Cài đặt & ngưỡng", icon: "settings" },
      { href: "/bang-mau", label: "Danh mục đại lý", icon: "agents" },
      { href: "/bang-mau/ke-hoach-thkh", label: "THKH mục tiêu / tháng", icon: "reportPlanSummary" },
    ],
  },
];

export type OverviewTile = {
  href: string;
  title: string;
  description: string;
};

export type OverviewTileGroup = {
  id: string;
  title: string;
  subtitle?: string;
  tiles: OverviewTile[];
};

/** Điểm vào nhanh trên Dashboard — nhóm theo việc user hay làm. */
export const overviewTileGroups: OverviewTileGroup[] = [
  {
    id: "ao-nhat-ky",
    title: "Ao & nhật ký",
    subtitle: "Thiết lập ao trước, sau đó ghi nhật ký tại ao bằng QR.",
    tiles: [
      {
        href: "/vung-nuoi",
        title: "Quản lý vùng nuôi",
        description: "Danh sách chủ hộ, tạo mã ao, in QR; từ đây mở lịch sử nhật ký từng ao.",
      },
      {
        href: "/nhat-ky",
        title: "Nhập nhật ký (QR)",
        description: "Mở trên điện thoại: quét QR dán tại ao để nhập thức ăn, môi trường, tồn.",
      },
      {
        href: "/nhat-ky/lich-su",
        title: "Lịch sử nhật ký",
        description: "Xem lại bản ghi đã lưu; lọc theo ao, ngày — hoặc vào từ cột Lịch sử ở quản lý ao.",
      },
    ],
  },
  {
    id: "bao-cao",
    title: "Báo cáo & theo dõi",
    subtitle: "Sau khi có dữ liệu nhật ký và cập nhật kế hoạch thu trên ao.",
    tiles: [
      {
        href: "/bao-cao",
        title: "Hướng dẫn & danh sách báo cáo",
        description: "Mô tả từng báo cáo, mục đích, bộ lọc và lưu ý trước khi mở màn chi tiết.",
      },
      {
        href: "/bao-cao/ke-hoach-thu-hoach",
        title: "Kế hoạch thu & sản lượng",
        description: "Chi tiết từng ao: ngày thu, tấn, cảnh báo, đánh dấu đã thu.",
      },
      {
        href: "/bao-cao/tong-hop-ke-hoach",
        title: "Tổng hợp kế hoạch (đại lý)",
        description: "Tổng tấn theo tháng: gốc / điều chỉnh / sai khác CC·CT.",
      },
      {
        href: "/bao-cao/moi-truong",
        title: "Môi trường",
        description: "DO, pH, NH3… từ nhật ký gần nhất.",
      },
    ],
  },
  {
    id: "cai-dat",
    title: "Danh mục & cài đặt",
    subtitle: "Cấu hình một lần hoặc khi đổi quy trình.",
    tiles: [
      {
        href: "/cai-dat",
        title: "Cài đặt & ngưỡng",
        description: "Ngưỡng cảnh báo môi trường, preset công thức, tài khoản.",
      },
      {
        href: "/bang-mau",
        title: "Danh mục đại lý",
        description: "Đầu mối / khu vực — gắn với ao và báo cáo.",
      },
      {
        href: "/bang-mau/ke-hoach-thkh",
        title: "THKH mục tiêu / tháng",
        description: "Nhập tấn mục tiêu theo đại lý cho biểu đồ trên Dashboard.",
      },
    ],
  },
];
