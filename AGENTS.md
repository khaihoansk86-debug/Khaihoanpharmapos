# Quy tắc bảo vệ logic lõi (LỆNH ĐÓNG BĂNG - STRICT FREEZE)

Các luồng nghiệp vụ chính của PharmaPOS ĐÃ ĐƯỢC ĐÓNG BĂNG (FROZEN) và tuyệt đối không được phép chỉnh sửa. Bất kỳ AI nào chạm vào các công thức tính toán cốt lõi đều bị xem là vi phạm nghiêm trọng quy tắc hệ thống!

## Nguyên tắc bắt buộc (KHÔNG ĐƯỢC VI PHẠM)

- **TUYỆT ĐỐI KHÔNG ĐỤNG VÀO (DO NOT TOUCH):** Bất kỳ công thức tính toán báo cáo, tính toán doanh thu, giá vốn, lợi nhuận, hay số lượng nào đang chạy ổn định.
- AI chỉ được phép dựa trên dữ liệu/logic nền tảng hiện có để phát triển tính năng mới ở bề nổi (UI/hiển thị), KHÔNG ĐƯỢC PHÉP thay đổi bản chất luồng dữ liệu hay logic tính toán bên dưới (dù bạn nghĩ đó là sửa lỗi).
- Tính năng mới phải ưu tiên bổ sung module `*Rules.js`, adapter, helper hoặc service mới rồi gọi từ controller.
- Không chèn điều kiện đặc thù của tính năng mới trực tiếp vào luồng nghiệp vụ chung khi có thể tách thành rule thuần.
- Phải giữ nguyên định dạng dữ liệu, ý nghĩa trường, loại giao dịch, cách tính tiền, tồn kho, công nợ và ca làm việc hiện có.
- Mọi thay đổi chạm logic lõi phải có test hồi quy cho hành vi cũ và test cho hành vi mới.
- Không sửa migration Supabase đã triển khai. Thay đổi schema phải tạo migration mới có số thứ tự tiếp theo.
- Nếu yêu cầu mới xung đột với hợp đồng lõi, dừng lại và nêu rõ xung đột trước khi sửa.

## Module lõi bị ĐÓNG BĂNG (FROZEN MODULES - DO NOT EDIT)

- `js/features/reports/reportAnalyticsRules.js` (Lệnh Cấm Tuyệt Đối Đụng Vào)
- `js/features/pos/orderService.js`
- `js/features/pos/orderRules.js`
- `js/features/pos/inventoryIssueRules.js`
- `js/features/pos/shiftAmountRules.js`
- `js/features/pos/shiftSelection.js`
- `js/features/pos/shiftSyncService.js`
- `js/features/inventory/inventoryService.js`
- `js/features/products/productService.js`
- `js/features/reports/reportService.js`
- `js/features/reports/doseReportRules.js`
- `js/features/reports/overviewShiftService.js`
- Các migration hiện có trong `supabase/migrations/`

Chi tiết hợp đồng và cách mở rộng nằm tại `docs/core-logic-contract.md`.
