# Prompt bàn giao cho topic Zalo — preview và capability

PharmaPOS đã nâng giao diện pages/zalo.html thành 4 tab; hiện chỉ đọc settings/runtime/30 lệnh từ Supabase. Chưa có preview production; nút preview khóa, không enqueue send_* với preview:true. Nút gửi chỉ mở khi heartbeat có capability được xác minh. Chưa push/deploy UI.

Hãy đọc docs/zalo-pos-integration-contract.md trong D:/KhaiHoanPOS/pos và đối chiếu với source Zalo production mới nhất. Không coi nhãn version=production là commit server.

Các phần cần thống nhất và bổ sung phía backend:

1. Quảng bá controlCapabilities từ runtime đã xác minh: contractVersion, sourceCommit hash thật, commands đã đồng bộ SQL/handler/Manager. Chỉ bật verified sau kiểm chứng; không tự nhận hỗ trợ từ remote Git.
2. Command đọc riêng preview_inventory_health_v1, không gọi sender. Gọi nguồn dữ liệu/classifier/builder chính thức, không copy thuật toán vào POS.
3. Whitelist SQL cần migration mới sau kiểm tra sequence thực tế. Đề xuất migration trước, không tự chạy production. Phải cập nhật đồng bộ constraint command_type và enqueue whitelist.
4. Đo DTO thật để chọn command.result có giới hạn hay bảng preview riêng TTL/RLS trả result_id. Không dùng snapshot kiểm kê. Serializer riêng chỉ trường được phép, không nới safeResult cho mọi lệnh.
5. Trả contractVersion/ruleVersion/sourceCommit/observedAt/businessDate/counts/sections/messages theo cùng snapshot; null giữ nguyên; section có thể chồng lấp. Danh sách và tổng phải khớp. Chốt field DTO trước khi nối POS adapter đang unavailable.
6. Chứng minh preview không tạo hàng đợi Manager, không gọi Zalo, không ghi dữ liệu nghiệp vụ; test quyền admin, lỗi dữ liệu, quá kích thước, hết TTL.
7. Giữ audience operations_group/admin_primary, không nhận target tùy ý từ frontend. Chưa mở nhiều account/worker. Không đổi lịch/người nhận.
8. Chưa có phân loại bán chậm và độ tin cậy dùng chung DB: hiển thị chưa có đánh giá. Không đọc artifact 08/09 làm nguồn runtime.

Khi hoàn thành cung cấp commit triển khai thật, DTO mẫu đã làm sạch, kiểm thử và capability telemetry. POS sẽ nối adapter sau khi contract đã xác minh. Không push/deploy/restart/gửi tin thật khi chưa được người dùng cho phép trong topic Zalo.
