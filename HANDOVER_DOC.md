# TÀI LIỆU BÀN GIAO DỰ ÁN: PharmaPOS (Khải Hoàn Pharma)

*Tài liệu này được tạo ra nhằm mục đích bàn giao toàn bộ ngữ cảnh, kiến trúc, quy tắc và trạng thái hiện tại của dự án cho AI (Codex/Claude/Gemini) hoặc lập trình viên tiếp quản để có thể tiếp tục phát triển mà không làm gãy vỡ logic cốt lõi.*

---

## 1. TỔNG QUAN KIẾN TRÚC (ARCHITECTURE)
- **Loại ứng dụng:** Web-based POS (Point of Sale) dành cho nhà thuốc.
- **Frontend:** HTML thuần, CSS, Vanilla JavaScript (Không dùng framework như React/Vue). Tổ chức theo mô hình Controller - Service - UI.
- **Backend & Database:** Supabase (PostgreSQL). Sử dụng trực tiếp Supabase JS Client ở Frontend để giao tiếp với DB.
- **Môi trường chạy:** Trình duyệt Web trên hệ điều hành Windows.

## 2. CẤU TRÚC THƯ MỤC CHÍNH
- pages/: Chứa các trang giao diện HTML (pos.html, inventory.html, purchase.html...).
- js/features/: Chứa toàn bộ logic nghiệp vụ, chia theo từng module:
  - pos/: Module bán hàng (Trọng điểm và phức tạp nhất). Chứa posController.js, orderService.js, posUI.js.
  - inventory/: Quản lý kho, kiểm kê.
  - purchase/: Nhập hàng từ Nhà Cung Cấp.
  - customers/ & suppliers/: Quản lý khách hàng, nhà cung cấp và công nợ.
  - eports/: Báo cáo doanh thu, ca làm việc.
  - employees/: Quản lý nhân viên, chấm công, chốt ca (employeesController.js).
- supabase/migrations/: Chứa lịch sử cấu trúc DB (Rất quan trọng, không được sửa các file cũ, chỉ được tạo migration mới nếu cần đổi schema).
- ot-assistant/: Chứa mã nguồn Node.js (Puppeteer) phục vụ việc chạy Zalo Bot tự động nhắn tin báo cáo nội bộ.

## 3. CÁC QUY TẮC LÕI BẤT KHẢ XÂM PHẠM (FROZEN RULES)
> [!CAUTION]
> AI tiếp quản **TUYỆT ĐỐI KHÔNG ĐƯỢC CHỈNH SỬA** các file/luồng logic sau nếu không có lệnh bắt buộc, vì đây là xương sống tài chính của hệ thống:

1. **Luồng Trừ Tồn Kho Theo Lô (Batch Inventory):** Xử lý tại ssertSufficientStock và eserveBatchAllocations trong orderService.js. Hệ thống áp dụng quản lý tồn kho khắt khe (Strict Inventory) - không cho phép bán âm.
2. **Luồng Ghi Dữ Liệu Đa Bước (Persistence Workflow):** Tại orderPersistenceWorkflow.js và createOrder. Việc lưu hóa đơn và trừ tồn kho là nguyên khối (Transaction-like). Nếu 1 bước hỏng phải rollback.
3. **Dòng Tiền Ca Làm Việc (Shift Cash Flow):** shiftAmountRules.js và shiftSyncService.js. Đảm bảo tiền mặt thu từ bán hàng, thu nợ, hoặc chi trả phải được cộng/trừ chính xác vào báo cáo ca (Shift) hiện tại.
4. **Các file bị ĐÓNG BĂNG (Không đụng vào):**
   - js/features/reports/reportAnalyticsRules.js
   - Các file rules khác có đuôi *Rules.js.

## 4. QUY TẮC MÔI TRƯỜNG WINDOWS (CRITICAL FOR AI)
> [!WARNING]
> Máy tính của Khải Hoàn sử dụng Windows (Mặc định mã hóa file CP1252).
> **KHÔNG SỬ DỤNG** các công cụ tự động như eplace_file_content hay multi_replace_file_content (hoặc lệnh sed) để sửa các file có chứa **TIẾNG VIỆT CÓ DẤU** (HTML, JS chứa text UI). Nếu làm vậy sẽ làm vỡ font (Mojibake).
> **Cách xử lý BẮT BUỘC:** Nếu AI cần sửa file, phải dùng script Python (open(..., encoding='utf-8')) hoặc viết lệnh PowerShell ép -Encoding UTF8.

## 5. CẬP NHẬT GẦN NHẤT & FIX BUGS CẦN LƯU Ý
- **Fix lỗi "Ảo ảnh thành công / Mất đơn hàng" tại POS (Hoàn tất):**
  - **Vấn đề cũ:** Tại posController.js, luồng bán lẻ được chạy ngầm ((async () => {})()). Khi gặp lỗi tồn kho, nó tự văng lỗi ngầm nhưng giao diện đã kịp xóa giỏ hàng, khiến thu ngân lầm tưởng là đã bán thành công nhưng thực tế dữ liệu không được lưu.
  - **Cách đã fix:** Đã chuyển khối code thanh toán bán lẻ thành **Synchronous (Đồng bộ)**. Bọc bằng 	ry...catch. Bắt buộc chờ Database phản hồi. Nếu lỗi thiếu kho, hệ thống sẽ chĩa thẳng thông báo lỗi lên màn hình bằng lert() và giữ nguyên giỏ hàng. Đã rà soát các luồng khác (Nhập hàng, trả nợ, kiểm kê) và xác nhận TẤT CẢ đều đã đồng bộ an toàn.
  - *Ghi chú cho AI sau:* Không được tối ưu hóa theo kiểu tách tiến trình (detach background task) trong các luồng thanh toán (Purchase, Invoices, Stocktake) để tránh dẫm lại vết xe đổ này.

## 6. CÔNG VIỆC TIẾP THEO (NEXT STEPS) - ZALO BOT
- **Mục tiêu:** Vận hành hệ thống nhắc nhở tự động cho nhân viên thông qua Zalo cá nhân.
- **Hiện trạng:** Đã có bộ khung tại thư mục ot-assistant/ gồm zaloBot.js (dùng Puppeteer điều khiển Zalo Web) và index.js (dùng node-cron để gửi báo cáo cận date, hết hàng, kiểm kê random).
- **Việc cần làm tiếp theo của AI:**
  1. Hỗ trợ người dùng thiết lập môi trường Node.js và chạy file index.js lần đầu để quét mã QR và lưu phiên (session).
  2. Bổ sung các tính năng gửi tin nhắn mới nếu người dùng yêu cầu (ví dụ: tạo API localhost để gửi tin realtime từ giao diện POS bắn qua Bot).
  3. Xử lý các tình huống lỗi timeout hoặc văng session của Zalo Web để giúp bot tự phục hồi.

---
**Chúc AI/Lập trình viên tiếp theo hoàn thành tốt công việc! Khởi đầu từ đây, hãy tuân thủ chặt chẽ các luật lệ phía trên.**
