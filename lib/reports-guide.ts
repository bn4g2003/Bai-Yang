import type { NavIconId } from "@/lib/nav-config";

export type ReportGuideEntry = {
  href: string;
  title: string;
  icon: NavIconId;
  /** Một đoạn mô tả ngắn. */
  summary: string;
  /** Việc nghiệp vụ báo cáo phục vụ. */
  purpose: string;
  /** Bộ lọc hoặc tham số chính trên màn hình. */
  filters: string;
  /** Gợi ý thao tác / lưu ý dữ liệu. */
  tips: string[];
};

export const reportGuideEntries: ReportGuideEntry[] = [
  {
    href: "/bao-cao/ke-hoach-thu-hoach",
    title: "Kế hoạch thu & sản lượng",
    icon: "reportHarvest",
    summary:
      "Bảng chi tiết theo từng ao: lịch thu gốc và điều chỉnh, sản lượng dự kiến/đã thu, tồn ước tính, cảnh báo thời điểm thu.",
    purpose:
      "Theo dõi từng hộ nuôi, đối chiếu kế hoạch với thực tế, ưu tiên ao cần thu gấp; có thể đánh dấu đã thu ngay trên lưới.",
    filters: "Tháng/năm (theo ngày thu hiệu lực — điều chỉnh hoặc gốc), đại lý/khu vực, trạng thái ao CC / CT / TH.",
    tips: [
      "Cột “Còn phải thu (tấn)” = dự kiến hiệu lực trừ đã thu thực tế (không âm).",
      "“Ưu tiên thu” / “Quá hạn” dựa trên số ngày còn lại đến ngày thu hiệu lực (không xét riêng khối lượng).",
      "Tick “Đã thu” sẽ cập nhật ao sang TH và ghi ngày thu nếu đang trống — kiểm tra lại sản lượng thực tế tại Quản lý vùng nuôi nếu cần chỉnh tay.",
      "Xuất Excel hoặc PDF từ thanh công cụ phía trên bảng.",
    ],
  },
  {
    href: "/bao-cao/tong-hop-ke-hoach",
    title: "Tổng hợp kế hoạch (đại lý)",
    icon: "reportPlanSummary",
    summary:
      "Bảng tổng tấn theo tháng và theo đại lý: kế hoạch gốc (CC và CT riêng), kế hoạch sau điều chỉnh, và cột sai khác (điều chỉnh − gốc).",
    purpose:
      "So sánh nhanh kế hoạch theo tháng với đầu mối/đại lý; phù hợp họp điều hành hoặc đối chiếu với chỉ tiêu THKH.",
    filters: "Chọn năm; dữ liệu lấy từ view v_monthly_yield_by_agent (gồm vòng nuôi đã lưu lịch sử nếu có).",
    tips: [
      "“Gốc” hiểu theo dữ liệu kế hoạch hiện tại trên ao/vòng — không phải snapshot cố định lúc đăng ký trừ khi quy trình nội bộ quy định khác.",
      "CC = ao đang có cá; CT = kế hoạch thả / chưa thả — phân bổ tấn theo từng nhóm.",
      "Xuất file từ nút trên cùng để gửi email hoặc in.",
    ],
  },
  {
    href: "/bao-cao/moi-truong",
    title: "Môi trường",
    icon: "reportEnv",
    summary: "Danh sách các bản ghi nhật ký gần đây kèm chỉ số nước ao: nhiệt độ, pH, DO, NH3… theo mã ao.",
    purpose: "Rà soát nhanh thông số đã nhập từ nhật ký hàng ngày; bổ sung cho cảnh báo ngưỡng trên Dashboard và mục Cài đặt.",
    filters: "Bảng cố định số dòng gần nhất (không có bộ lọc ngày/ao trên màn — dùng Lịch sử nhật ký nếu cần lọc sâu).",
    tips: [
      "Ngưỡng cảnh báo (màu đỏ trên Dashboard) cấu hình tại Cài đặt & ngưỡng.",
      "Muốn xem đủ theo ao và khoảng ngày: Nhật ký → Lịch sử nhật ký, hoặc từ cột “Lịch sử” ở Quản lý vùng nuôi.",
    ],
  },
];
