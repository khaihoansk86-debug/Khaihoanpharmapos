# Kiểm chứng UI điều phối Zalo — 08/09/2026

## Bàn giao mới 10/09/2026

Báo cáo: D:/KhaiHoanPOS/reports/zalo-integration-20260910/KET-QUA.md. POS557/557, bot164/164, E2E hai lượt PASS; ảnh fixture và DTO READ ONLY thật tách riêng. Có1 moderate qs POS, chưa deploy/gửi. Bổ sung trạng thái Bot/Manager/Zalo riêng, tên requester, chi tiết kỹ thuật, không giữ xanh khi offline, malformed DTO là lỗi, giữ queued ID quá15m. Rule gợi ý hàng hết sửa tại backend v2, không frontend. Các đoạn dưới là lịch sử.

## Cập nhật 10/09/2026 — adapter local đã nối, backend chưa deploy

Migration 105 đã deploy ngày 09/09 (xem zalo-preview-migration-105-verification.md). Adapter POS nay gọi command preview riêng với payload rỗng khi admin bấm nút, chỉ sau kiểm tra heartbeat mới + capability preview. Không enqueue khi mở trang/F5/tab/làm mới. Đọc command chính xác theo UUID, kiểm tra reference + TTL + byte_count, lấy DTO qua admin RPC; không tính lại tồn.

SessionStorage chỉ giữ intent/mã lệnh theo Auth user, không giữ DTO. Mất mạng/F5 kiểm tra lại lệnh cũ; bấm đúp không thêm lệnh. Tiếp nhận không rõ mã khóa tạo lại 5 phút; lệnh biết mã giữ tối đa 15 phút. Hết thời gian chỉ cho phép lần bấm mới, không tự retry. Kiểm tra lại admin trước trả DTO, ẩn preview khi refresh không xác minh quyền, xóa hiển thị khi hết TTL.

Kiểm chứng mới: 161 suites / 557 tests PASS; E2E headless PASS hai lần (lần sau có kiểm tra quyền sau đọc), dùng adapter/controller thật + SDK/Layout mock. Luồng mới gồm preview bấm đúp, F5 khi queued, lỗi mạng khi đọc, reconnect rồi lấy DTO cùng mã. Không gọi backend/Zalo thật. Syntax/diff pass; không thêm dependency, không đo coverage. Ảnh fixture mới: D:/Khaihoanpharmapos/zalo-ui-20260910.

Heartbeat thật đọc 10/09 10:52 VN vẫn online, version=production, metadata chỉ node/platform. Chưa xác minh worker source/capability; nút preview/gửi vẫn khóa trên runtime này. Chưa commit/push/deploy trong lượt adapter. Updater backend hiện chạy npm run check cả tại live repo, trái hướng dẫn cách ly tests khỏi data/profile; chưa kích hoạt nhánh production. Cần giải quyết đường deploy server trước nghiệm thu preview Auth → worker thật → UI.

Các phần bên dưới là lịch sử kiểm chứng ngày 08/09, không mô tả trạng thái adapter hiện tại.

## Đã triển khai local

- pages/zalo.html: bốn tab trên trang cũ, không thêm dashboard/Chrome control.
- js/features/zalo/zaloController.js: read-only refresh, lọc/phân trang 10 dòng trong 30 lệnh, tuổi heartbeat, chặn gửi thiếu capability/cũ/lỗi mạng, xác nhận audience/ngoài lịch, focus trap/Escape/restore focus, khóa double-click, không retry mù khi không rõ kết quả.
- zaloControlService.js: giữ SDK/RPC hiện có, read admin RPC, whitelist frontend, timeout 15 giây, kiểm tra UUID kết quả; không payload preview.
- zaloControlRules.js: nhãn dưới Min, không lấy raw error làm trạng thái, không suy ra Manager online từ heartbeat; cron thiếu không giả 20:00.
- zaloInventoryViewRules.js: DTO whitelist/null/counts/nhóm chồng lấp/search, không classifier tồn.
- zaloInventoryPreviewService.js: trả unavailable, không có side effect hoặc gọi lệnh gửi.
- zalo-control.css: responsive/dark/focus, bảng cuộn trong khung trên điện thoại.
- js/features/products/productZaloLinkRules.js và hook nhỏ ở cuối loadProductsData trong productController.js: focus SKU đã có trong catalog bằng UI sẵn có, không ghi dữ liệu. File controller trước đó dirty, giữ các thay đổi cũ.
- docs/zalo-pos-integration-contract.md và zalo-backend-handoff-prompt.md: trạng thái EXISTING/PROPOSED/UNAVAILABLE và phần backend cần bổ sung.

## Bằng chứng

- Đọc deployed enqueue RPC và RLS: admin-only, 8 lệnh, chưa preview. Runtime chỉ version production, metadata node/platform. Không chứng minh hash server.
- Full Jest: 160 suites / 556 tests PASS. Sau chốt UUID/fixture biên, targeted 4 suites / 6 tests PASS.
- Browser tests/e2e/zaloControlCenter.test.js: PASS. Server local + SDK mock, chặn toàn bộ backend ngoài; chỉ CDN style/font được tải. Không gửi tin/lệnh Supabase thật. Layout được mock để cô lập controller; không thay thế chứng minh end-to-end Supabase Auth/RLS production. RLS được kiểm tra read-only riêng.
- Browser scenarios: admin check true/false; unavailable preview/capability; empty; offline; heartbeat stale; tab/search; filter/page; snapshot render; Escape/focus; double click 1 RPC mock; không enqueue khi mở/refresh/preview. Ảnh inventory fixture có nhãn dữ liệu kiểm thử.
- Pure DTO: null/0/Maxnull, dưới Min20/34, nhóm chưa Min+hết hàng chồng lấp, tồn cần đối chiếu/expiry notes do backend cung cấp, không diễn giải lại classifier. Không kiểm thử thuật toán kho Zalo trong repo POS.
- Kiểm tra cú pháp và git diff --check PASS. Không có build/typecheck/lint script riêng; không đo coverage hay chạy npm audit trong lượt UI này. Không thêm dependency.

Ảnh tại D:/Khaihoanpharmapos/zalo-ui-20260908:

- desktop-unavailable.png: UI thật với trạng thái preview chưa hỗ trợ, SDK mock.
- desktop-fixture.png và mobile-dark-fixture.png: hình thức DTO từ fixture test, KHÔNG dữ liệu production.

## Chưa liên thông / chưa triển khai

Preview trực tiếp, capability backend và hash runtime: chưa có. Nút gửi đang khóa trên telemetry hiện tại theo yêu cầu bàn giao. Cần đồng bộ bên Zalo + SQL whitelist + serializer trước khi nối adapter; metadata contract hiện mới là đề xuất.

Người nhận Manager chưa đồng bộ ngược POS. Bán chậm/độ tin cậy chưa có DB chung, UI ghi chưa có đánh giá. Phân trang chỉ trong 30 lệnh gần nhất, không tuyên bố toàn bộ cron/queue. Không đọc raw errors/payload vào UI.

Không sửa repo Zalo, không sửa schema, không đổi lịch/người nhận/MinMax, không gửi Zalo thật, không commit/push/deploy/restart. Các thay đổi cũ trong worktree được giữ nguyên.
