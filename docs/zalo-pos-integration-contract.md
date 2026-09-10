# Điều phối Zalo trong PharmaPOS — contract v1

## Bàn giao mới 10/09/2026 (16:24 VN)

Ưu tiên báo cáo D:/KhaiHoanPOS/reports/zalo-integration-20260910/KET-QUA.md. Backend rule v2 bổ sung gợi ý hàng hết; DTO contract v1 không đổi. POS giữ sourceCommit, phân biệt lỗi/TTL/rỗng/unavailable và giữ queued ID quá15m. SQL105 đã có; không migration mới. Chưa commit/push/deploy/gửi. Preview CLI thật 29/7/381/62/1, không thay thế live worker/Auth. Các cập nhật phía dưới là lịch sử.

## Cập nhật 10/09/2026

SQL 105 đã triển khai 09/09: preview_inventory_health_v1, bảng kết quả riêng TTL15m/1MiB/admin RLS và RPC đọc; fingerprint SQL verified=true. POS local đã nối adapter đọc kết quả theo result_id, chỉ enqueue bằng thao tác bấm rõ ràng khi capability preview được xác minh. Không dùng send_* để preview. Backend đang chạy chưa có controlCapabilities theo heartbeat đọc ngày 10/09, nên giao diện chưa mở preview/gửi trên production. Chi tiết kiểm thử/resume sau F5 tại zalo-ui-verification.md. Các mô tả PROPOSED/UNAVAILABLE phía dưới giữ làm lịch sử 08/09; ưu tiên cập nhật này và contract backend v1 đã duyệt.

## Trạng thái xác minh 08/09/2026

POS: D:/KhaiHoanPOS/pos, main 6f16950, ahead origin/main 1; giữ toàn bộ dirty state. D:/Khaihoanpharmapos là thư mục artifact, không phải Git checkout tại lúc khảo sát.

EXISTING: Supabase Auth; RLS settings/runtime/commands chỉ admin; RPC enqueue_zalo_bot_command kiểm tra is_current_employee_admin(), whitelist 8 lệnh và trả UUID. UUID là tiếp nhận, không phải gửi thành công. Dashboard đọc 30 lệnh gần nhất; không phải lịch sử cron hoặc tổng queue hệ thống. Lịch lấy từ settings, timezone Asia/Ho_Chi_Minh. Manager quyết định target thực tế từ cấu hình riêng, POS không chứng nhận target đã đồng bộ.

EXISTING: Bot → Manager → Chrome trên server. POS chỉ đọc Supabase và enqueue nghiệp vụ đã được hỗ trợ; không gọi cổng Manager/CDP, không thêm queue/worker, không điều khiển account. Đóng POS không dừng bot. Tài khoản hiện tại thuộc Manager; chưa có routing đa account.

UNAVAILABLE: runtime production hiện chỉ có nhãn version=production, metadata node/platform; không có hash/capability. Không suy ra phiên bản server từ commit remote. Nút gửi trong UI mới khóa khi thiếu capability đã xác minh. Whitelist gửi cũ vẫn giữ nhưng không tự kích hoạt. Backend RPC hiện KHÔNG có preview_inventory_health_v1; không được enqueue send_* với payload.preview.

## PROPOSED — cần topic Zalo và phê duyệt schema riêng

Capability nguồn server đã xác minh: metadata.controlCapabilities = {contractVersion:1, verified:true, sourceCommit:<40 hex>, commands:[whitelist đã triển khai], previewInventoryHealthV1:true/false}. Chỉ quảng bá sau khi đồng bộ handler + SQL whitelist + serializer + phân tuyến Manager. Heartbeat phải mới dưới 3 phút; mất mạng/không rõ khả năng khóa nút gửi. Trường này là đề xuất, KHÔNG API đang có; chưa bật tự động chỉ từ version.

Preview command riêng preview_inventory_health_v1: chỉ đọc, tuyệt đối không gọi sender. SQL whitelist, handler, kiểm thử và capability phải triển khai trước. Không sửa migration cũ, không tự chọn số migration. POS adapter bản này trả unavailable; cần kết nối adapter trong lượt tích hợp tiếp theo sau khi contract được chấp thuận.

DTO đề xuất (không chứa credential, raw payload, target riêng tư):

    { contractVersion:1, ruleVersion:string, sourceCommit:null|string,
      observedAt:ISO timestamp, businessDate:YYYY-MM-DD,
      counts:{outOfStock:number,belowMin:number,aboveMax:number,withoutMin:number,needsReview:number},
      sections:{outOfStock:Item[],belowMin:Item[],aboveMax:Item[],withoutMin:Item[],needsReview:Item[]},
      messages:[{audience:'operations_group'|'admin_primary',parts:string[]}] }

Item = {productId:UUID, code:string,name:string,availableStock:number|null,baseUnit:string|null,min:number|null,max:number|null,note:string}. Null không đổi thành 0. UI kiểm tra DTO/counts đúng cùng snapshot, không tính lại tồn/classifier; SKU có thể xuất hiện ở nhiều nhóm, không cộng counts thành tổng SKU. Không load fixture trong production. Liên kết sản phẩm chỉ là điều hướng; quyền đọc/sửa do POS hiện có quyết định.

Đo kích thước DTO thật trước khi chọn command.result hay bảng preview riêng có TTL/RLS. Nếu vượt ngưỡng đã thống nhất, trả result_id; không dùng bảng snapshot kiểm kê, không nới safeResult toàn cục. DTO hiện tại yêu cầu đầy đủ section; nếu phân trang backend thì phải phiên bản hóa contract.

Mapping: send_out_of_stock_report → out_of_stock → Nhóm vận hành; send_low_stock_report → low_stock → Nhóm vận hành; send_admin_agenda → admin_agenda → Admin; send_missing_cost_report → missing_cost → Nhóm vận hành. Các lệnh gửi tính lại dữ liệu khi thực thi, không gửi nguyên snapshot xem trước. Muốn gửi đúng preview cần contract khác được duyệt.

## Quy tắc giữ nguyên ở backend

Tồn khả dụng=0 hết; 0<tồn<Min dưới; bằng Min không thiếu. Min/Max null khác 0, không fallback10. Hạn hôm nay còn hợp lệ đến hết ngày VN. Lô ngày lỗi/tồn âm/đơn vị không rõ cần đối chiếu. Loại gói liều/combo ảo/dòng cha/ngừng kinh doanh, giữ SKU thành phần vật lý. Dưới min không phải yêu cầu bắt buộc nhập. Bán chậm/độ tin cậy chưa có nguồn DB chung → UI ghi Chưa có đánh giá; không dùng artifact ngày 08/09 làm nguồn runtime. Đề xuất review theo SKU/ngày hiệu lực/nguồn/người duyệt, không tự tạo schema cấm nhập.

## Trạng thái, an toàn

completed chỉ handler kết thúc; số sent chỉ được ghi là kết quả handler báo, không tự diễn giải thành số phần/đã nhận tin. Không có bằng chứng gửi: hiển thị chưa xác nhận. Timeout gửi không retry tự động; đối chiếu lịch sử trước. Mọi nút gửi có xác nhận nghiệp vụ/audience/ngoài lịch; khóa double-click đồng bộ. Filter/tab/refresh không enqueue.

UI admin hint không thay RLS: xác minh role qua RPC read is_current_employee_admin trước tải dữ liệu. Không raw error/token ra màn hình, không service_role, không sửa lịch/người nhận khi mở trang. Không sửa repo Zalo, schema, push/deploy/restart hoặc gửi tin thật trong lượt UI này.
