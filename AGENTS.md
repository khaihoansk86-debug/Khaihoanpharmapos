# Quy tắc bảo vệ logic lõi

Các luồng nghiệp vụ chính của PharmaPOS đã được ổn định và được xem là hợp đồng tương thích ngược.

## Nguyên tắc bắt buộc

- Không thay đổi hành vi hiện có của logic lõi nếu người dùng không yêu cầu rõ ràng việc sửa hoặc mở khóa logic đó.
- Tính năng mới phải ưu tiên bổ sung module `*Rules.js`, adapter, helper hoặc service mới rồi gọi từ controller.
- Không chèn điều kiện đặc thù của tính năng mới trực tiếp vào luồng nghiệp vụ chung khi có thể tách thành rule thuần.
- Phải giữ nguyên định dạng dữ liệu, ý nghĩa trường, loại giao dịch, cách tính tiền, tồn kho, công nợ và ca làm việc hiện có.
- Mọi thay đổi chạm logic lõi phải có test hồi quy cho hành vi cũ và test cho hành vi mới.
- Không sửa migration Supabase đã triển khai. Thay đổi schema phải tạo migration mới có số thứ tự tiếp theo.
- Nếu yêu cầu mới xung đột với hợp đồng lõi, dừng lại và nêu rõ xung đột trước khi sửa.

## Module lõi được bảo vệ

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
