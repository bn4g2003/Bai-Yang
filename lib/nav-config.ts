export type NavIconId =
  | "dashboard"
  | "ponds"
  | "journal"
  | "journalHistory"
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
    label: "Vận hành",
    defaultOpen: true,
    items: [
      { href: "/vung-nuoi", label: "Quản lý vùng nuôi", icon: "ponds" },
      { href: "/nhat-ky", label: "Nhật ký ao (QR)", icon: "journal" },
      { href: "/nhat-ky/lich-su", label: "Lịch sử nhật ký", icon: "journalHistory" },
    ],
  },
  {
    id: "bao-cao",
    label: "Báo cáo",
    defaultOpen: true,
    items: [
      {
        href: "/bao-cao/ke-hoach-thu-hoach",
        label: "Kế hoạch thu & sản lượng",
        icon: "reportHarvest",
      },
      {
        href: "/bao-cao/tong-hop-ke-hoach",
        label: "Tổng hợp kế hoạch (đại lý)",
        icon: "reportPlanSummary",
      },
      { href: "/bao-cao/moi-truong", label: "Môi trường", icon: "reportEnv" },
    ],
  },
  {
    id: "he-thong",
    label: "Hệ thống",
    defaultOpen: false,
    items: [
      { href: "/cai-dat", label: "Cài đặt & danh mục", icon: "settings" },
      { href: "/bang-mau", label: "Danh mục đại lý", icon: "agents" },
      { href: "/bang-mau/ke-hoach-thkh", label: "THKH mục tiêu / tháng", icon: "reportPlanSummary" },
    ],
  },
];

export const overviewTiles: {
  href: string;
  title: string;
  description: string;
}[] = [
  {
    href: "/vung-nuoi",
    title: "Quản lý vùng nuôi",
    description: "Danh sách chủ hộ, tạo mã ao, cấp và in QR Code.",
  },
  {
    href: "/nhat-ky",
    title: "Nhật ký ao",
    description: "Quét QR tại ao để mở form nhập liệu hàng ngày trên điện thoại.",
  },
  {
    href: "/nhat-ky/lich-su",
    title: "Lịch sử nhật ký",
    description: "Xem lại các bản ghi nhật ký đã lưu, lọc theo ao và ngày.",
  },
  {
    href: "/bao-cao/ke-hoach-thu-hoach",
    title: "Báo cáo kế hoạch thu",
    description: "Lưới dữ liệu: đầu vào, tăng trưởng, dự báo, QA/QC, ghi chú xử lý.",
  },
  {
    href: "/bao-cao/tong-hop-ke-hoach",
    title: "Tổng hợp kế hoạch",
    description: "Tổng tấn theo tháng và đại lý: kế hoạch gốc vs điều chỉnh, CC/CT.",
  },
  {
    href: "/bao-cao/moi-truong",
    title: "Báo cáo môi trường",
    description: "Theo dõi DO, pH, NH3… từ nhật ký gần nhất.",
  },
  {
    href: "/cai-dat",
    title: "Cài đặt",
    description: "Ngưỡng môi trường, preset công thức, hướng dẫn user/role.",
  },
  {
    href: "/bang-mau",
    title: "Danh mục đại lý",
    description: "Quản lý đầu mối / khu vực — gắn với ao và báo cáo THKH.",
  },
  {
    href: "/bang-mau/ke-hoach-thkh",
    title: "THKH mục tiêu tháng",
    description: "Nhập tấn/tháng theo đại lý cho biểu đồ Dashboard.",
  },
];
