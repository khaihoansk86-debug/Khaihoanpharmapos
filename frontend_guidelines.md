# Bộ Quy Tắc Frontend (Frontend Guidelines) - Khải Hoàn POS

Bộ quy tắc này đóng vai trò như một "kim chỉ nam" để đảm bảo toàn bộ giao diện của hệ thống POS luôn nhất quán, chuyên nghiệp (premium), mang lại trải nghiệm người dùng (UX) xuất sắc và dễ dàng bảo trì.

---

## 1. Triết lý Thiết kế (Design Philosophy)
- **Rõ ràng & Sạch sẽ (Clean & Clear):** Ưu tiên không gian trắng (whitespace/padding). Không nhồi nhét quá nhiều thông tin vào một khu vực.
- **Tương phản cao (High Contrast):** Đảm bảo mọi đường viền, chữ cái và nút bấm đều dễ nhìn trong cả hai chế độ Sáng (Light) và Tối (Dark).
- **Phản hồi tức thì (Instant Feedback):** Mọi thao tác của người dùng (hover, click, điền form, tải dữ liệu) đều phải có phản hồi thị giác ngay lập tức.

---

## 2. Quy tắc Hệ thống Màu sắc & Giao diện (UI System)

### A. Độ tương phản & Đường viền (Borders)
- **Light Mode:** 
  - Khung viền chính nên dùng `border-slate-200` hoặc `border-slate-300` (không dùng slate-100 vì quá mờ).
  - Đối với các viền cần nổi bật (như các Card-style row trong Datatable), dùng `border-slate-300` hoặc `border-slate-400`.
- **Dark Mode:** Dùng `border-slate-700` hoặc `border-slate-800`.
- **Bo góc (Border Radius):** 
  - Mặc định cho các khối lớn (Cards, Modals, Tables): `rounded-2xl` hoặc `rounded-xl`.
  - Nút bấm, Inputs, Badges: `rounded-lg` hoặc `rounded-xl`.

### B. Kiểu chữ (Typography)
- **Phân cấp rõ ràng:**
  - Tiêu đề (Headers): Dùng font-weight `font-black` hoặc `font-bold`, màu `text-slate-900` (Light) / `text-white` (Dark).
  - Nội dung phụ (Sub-text): Dùng cỡ chữ nhỏ `text-sm` hoặc `text-xs`, font-weight `font-medium`, màu `text-slate-500` hoặc `text-slate-600`.
  - Nhãn (Labels/Badges): Dùng `uppercase tracking-widest text-[10px] font-black` để tạo cảm giác chuyên nghiệp, gọn gàng.

### C. Bóng đổ (Shadows)
- Các thành phần nổi (Modals, Dropdowns) phải có shadow lớn: `shadow-xl` hoặc `shadow-2xl`.
- Các khối nội dung (Cards, Rows): Dùng `shadow-sm` mặc định và nâng lên `shadow-md` khi hover.

---

## 3. Quy tắc cho Bảng Dữ liệu (Datatable)
- **Sử dụng Card-style Rows:** Thay vì các hàng dính liền nhau, hãy tách mỗi hàng thành một Card độc lập (sử dụng `border-separate border-spacing-y-3` trong thẻ `table`).
- **Khung viền:** Mỗi hàng phải có viền bao quanh rõ ràng (ví dụ: `border-y border-l rounded-l-2xl` cho cột đầu, và `border-y border-r rounded-r-2xl` cho cột cuối).
- **Trạng thái Hover:** Khi người dùng di chuột qua một hàng, nền phải chuyển sang màu nổi bật hơn (ví dụ: `hover:bg-slate-50`) và kết hợp với hiệu ứng bóng đổ (`hover:shadow`).

---

## 4. Tương tác & Trạng thái (Interactions & States)

### A. Hiệu ứng chuyển động (Micro-animations)
- Tất cả các nút bấm, dòng dữ liệu, thẻ (cards) đều phải có `transition-all duration-200` hoặc `duration-300` để chuyển đổi màu sắc, bóng đổ mượt mà, không bị giật cục.

### B. Nút bấm (Buttons)
- **Nút Hành động Chính (Primary):** Dùng màu sắc nổi bật (như Xanh lá `bg-emerald-600` hoặc Xanh dương `bg-blue-600`), kết hợp bóng đổ có màu (`shadow-blue-500/30`), khi hover nền phải tối đi một chút.
- **Nút Hành động Phụ (Secondary):** Dùng nền xám nhạt (`bg-slate-100` / `dark:bg-slate-800`), chữ màu xám đậm.
- **Feedback:** Khi click nút để call API, Nút phải bị disable và đổi text thành "Đang xử lý...".

### C. Trạng thái tải & Lỗi (Loading & Error States)
- Không bao giờ để giao diện đóng băng mà không báo gì.
- Khi tải dữ liệu: Ẩn bảng và hiện khung Loading (Spinner xoay) ở giữa màn hình.
- Lỗi hệ thống/Network: Hiển thị giao diện báo lỗi thân thiện thay vì để trang trắng bóc. Nên có nút "Thử lại".
- Thành công/Thất bại: Hiển thị Toast Notification (Pop-up nhỏ góc màn hình) trong 3 giây.

---

## 5. Tổ chức Code (Clean Code & Architecture)
- **Tách Logic ra khỏi UI:** KHÔNG viết các đoạn script call API dài dòng trực tiếp vào file `.html`. 
  - Giao diện đặt ở `pages/`.
  - Logic gọi API đặt ở file Service (VD: `productService.js`).
  - Logic cập nhật giao diện, bắt sự kiện (Click, Input) đặt ở file Controller/UI (VD: `productUI.js`, `productController.js`).
- **Tránh trùng lặp (DRY):** Các thành phần dùng chung như Sidebar, Header phải được viết bằng JS nội suy (`layout.js`) để khi sửa chỉ cần sửa ở 1 nơi.

---

## 6. Biểu tượng (Icons) & Huy hiệu (Badges)
- **Badges:** Không dùng text thuần túy để biểu diễn trạng thái (như "Còn hàng", "Đang bán"). Hãy gói chúng trong Badge: 
  - Nền nhạt, chữ đậm: `bg-emerald-100 text-emerald-700`.
- **Icons:** Sử dụng FontAwesome thống nhất. Icon đứng cạnh text phải được căn giữa theo trục dọc (`flex items-center gap-2`).
