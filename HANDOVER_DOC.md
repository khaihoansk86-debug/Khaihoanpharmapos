# TÀI LIỆU BÀN GIAO DỰ ÁN: PharmaPOS (Khải Hoàn Pharma)

*Tài liệu này được tạo ra nhằm mục đích bàn giao toàn bộ ngữ cảnh, kiến trúc, quy tắc nghiệp vụ lõi, logic POS và trạng thái hiện tại của dự án cho AI (Codex/Claude/Gemini) hoặc lập trình viên tiếp quản để có thể tiếp tục phát triển mà không làm gãy vỡ hệ thống.*

---

## 1. TỔNG QUAN KIẾN TRÚC (ARCHITECTURE)
- **Loại ứng dụng:** Web-based POS (Point of Sale) dành riêng cho nhà thuốc.
- **Frontend:** HTML thuần, CSS Vanilla, JavaScript thuần (Mô hình Controller - Service - UI/Rules, KHÔNG dùng framework React/Vue).
- **Backend & Database:** Supabase (PostgreSQL). Sử dụng trực tiếp Supabase JS Client ở Frontend để giao tiếp DB.
- **Môi trường chạy:** Trình duyệt Web trên hệ điều hành Windows.

---

## 2. CẤU TRÚC THƯ MỤC CHÍNH & PHÂN LỚP LOGIC
- `pages/`: Chứa các trang giao diện HTML (`pos.html`, `inventory.html`, `purchase.html`, `reports.html`...).
- `js/features/`: Chứa logic nghiệp vụ phân lớp:
  - `pos/`: Module bán hàng (Trọng điểm và phức tạp nhất). Chứa `posController.js`, `orderService.js`, `orderRules.js`, `inventoryIssueRules.js`, `posUI.js`.
  - `inventory/`: Quản lý tồn kho, lô hạn dùng, nhập/xuất kho và kiểm kê (`inventoryService.js`).
  - `purchase/`: Nhập hàng từ Nhà Cung Cấp (`purchaseController.js`).
  - `customers/` & `suppliers/`: Quản lý khách hàng, nhà cung cấp và theo dõi công nợ.
  - `reports/`: Báo cáo doanh thu, lợi nhuận, ca làm việc (`reportAnalyticsRules.js`, `overviewShiftService.js`).
  - `employees/`: Quản lý nhân viên, chấm công, chọn/chốt ca làm việc (`employeesController.js`).
- `supabase/migrations/`: Chứa lịch sử cấu trúc DB (Bất biến, không sửa file cũ, chỉ tạo migration mới nối tiếp).
- `bot-assistant/`: Bộ công cụ Zalo Bot tự động gửi báo cáo và giao việc kiểm kê ngẫu nhiên 20 ngày.

---

## 3. CHI TIẾT LOGIC & NGHỆP VỤ LÕI CỦA POS (CRITICAL WORKFLOWS)

### A. Phân loại Đơn hàng (`orderRules.js`)
1. **Đơn bán lẻ (Retail):** Đơn bán thuốc thông thường cho khách lẻ.
2. **Đơn Thuốc liều (Dose Order):**
   - Mã hàng bắt đầu bằng `DOSE-`.
   - Dùng các cờ tương thích `is_dose_cut` và `is_dose_retail` trong `description`.
   - **Quy tắc trừ tồn kho:** Gói thuốc liều là gói ảo. Khi bán thuốc liều, hệ thống trừ tồn kho vật lý của từng **Nguyên liệu thành phần** tạo nên liều đó (không trừ gói ảo).
3. **Đơn Nội bộ & Thương mại điện tử:** Có quy tắc phân loại riêng, phải đọc qua `orderRules.js`.

### B. Trừ Tồn Kho Khắt Khe Theo Lô (Strict Batch Inventory)
- Xử lý tại `assertSufficientStock` và `reserveBatchAllocations` trong `orderService.js`.
- **Hệ thống KHÔNG CHO PHÉP BÁN ÂM KHO (Strict Inventory).**
- Khi bán hàng, hệ thống tự động bốc trừ tồn kho theo từng Lô (Batch) và Hạn dùng (Expiry Date) của đơn vị cơ sở (`base_unit`).
- Nhập kho (`purchase`) làm tăng tồn kho theo lô; Xuất kho/Trả hàng (`inventory`) làm giảm/hoàn tồn kho đúng giá vốn và số lượng cơ sở.

### C. Quản lý Ca Làm Việc & Dòng Tiền (Shift Cash Flow)
- Điều hành qua `shiftAmountRules.js`, `shiftSelection.js`, `shiftSyncService.js`.
- **Luồng dòng tiền ca:** `Tiền mặt bàn giao = Tiền đầu ca + Tiền bán hàng mặt + Tiền thu nợ - Tiền chi trả NCC - Tiền rút ca`.
- Bắt buộc phải thông qua service đồng bộ ca (`shiftSyncService.js`), tuyệt đối không được tự ý sửa trực tiếp số tiền ca từ Controller lẻ.

### D. Đồng Bộ Ghi Đơn Hàng Nguyên Khối (Persistence Workflow)
- Thực thi tại `orderPersistenceWorkflow.js`.
- Việc tạo hóa đơn, trừ kho lô, ghi nợ khách hàng và ghi nhận ca bán là nguyên khối (Transaction-like). Nếu bất kỳ bước nào thất bại, toàn bộ tiến trình phải Rollback và báo lỗi rõ ràng trên UI.

---

## 4. CÁC MODULE VÀ FILE BỊ ĐÓNG BĂNG (FROZEN MODULES - DO NOT TOUCH)
> [!CAUTION]
> Tuyệt đối **KHÔNG ĐƯỢC PHÉP CHỈNH SỬA** các file/luồng sau nếu không có yêu cầu đặc biệt từ người dùng:
- `js/features/reports/reportAnalyticsRules.js`
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
- Tất cả các migration cũ trong `supabase/migrations/`

---

## 5. BÀN GIAO MỚI NHẤT: HỆ THỐNG ZALO BOT TỰ ĐỘNG (UPDATED)
- **Kiến trúc vạn năng (Bền bỉ 100%):** Dùng cơ chế **Chrome Remote Debugging (Port 9222)** kết nối trực tiếp vào trình duyệt Chrome thật của máy tính. Không dùng Puppeteer tự mở để tránh bị Zalo quét phát hiện Bot và đá văng Cookie.
- **Thư mục & File vận hành:**
  - File chạy Chrome Bot ngoài Desktop: `Mo_Chrome_Zalo_Bot.bat` (Mở Chrome có Port 9222 + Profile riêng tại `d:\Khaihoanpharmapos\zalo-chrome-profile`).
  - File kết nối & nhắn tin: `bot-assistant/services/zaloService.js` (Dùng `puppeteer.connect({ browserURL: 'http://localhost:9222' })`).
  - Migration Database: `045_create_daily_inventory_tasks.sql` (Tạo bảng `bot_daily_inventory_tasks` tách biệt hoàn toàn khỏi nghiệp vụ POS lõi).
- **Thuật toán chia bài 20 ngày (20-Day Inventory Cycle):**
  - Tự động chia tổng toàn bộ danh sách sản phẩm trong kho ra kiểm kê trong 20 ngày.
  - Đảm bảo 100% mặt hàng trong kho được quét kiểm kê sạch sẽ trong 20 ngày mà không bị trùng lặp hay bỏ sót món nào.

---

## 6. QUY TẮC MÔI TRƯỜNG WINDOWS & LỆNH KIỂM THỬ (CRITICAL)
> [!WARNING]
> Môi trường Windows đọc/ghi ngầm định CP1252.
> **KHÔNG SỬ DỤNG** `replace_file_content` trực tiếp trên các file chứa **TIẾNG VIỆT CÓ DẤU**.
> **Cách xử lý BẮT BUỘC:** Dùng script Python `open(..., encoding='utf-8')` hoặc lệnh PowerShell `-Encoding UTF8`.

### Lệnh kiểm thử bắt buộc trước khi bàn giao:
```powershell
npm.cmd test -- --runInBand
```
Nếu sửa file JavaScript ngoài phạm vi test, kiểm tra cú pháp bằng:
```powershell
node --check <duong-dan-file>
```

---
*Tài liệu đã được kiểm duyệt và đồng bộ 100% với trạng thái mới nhất của dự án Khải Hoàn PharmaPOS.*
