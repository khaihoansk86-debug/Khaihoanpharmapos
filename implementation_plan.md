# Kế hoạch triển khai: Tính năng Sửa Biến Thể Inline (Cùng Giao Diện)

## Mô tả mục tiêu
Người dùng phản hồi rằng việc bấm "Sửa" một biến thể con (từ Accordion ở bảng chính hoặc từ Mục 6 trong Modal) làm mở ra một Modal mới (reload lại context) là "nhảy qua khác" và rất khó quản lý. 
Mục tiêu là xây dựng một form chỉnh sửa nhanh (Inline Edit Form) ngay tại chỗ (ngay bên dưới dòng biến thể) để người dùng cập nhật: Giá bán, Giá vốn, và Danh sách Lô hàng/Hạn sử dụng mà không bị rời khỏi giao diện hiện tại.

## Thiết kế giao diện (UI)
- Khi bấm **Sửa** tại một dòng biến thể (dù là ở bảng chính hay trong Modal sản phẩm cha), dòng đó sẽ xổ xuống một Panel (hoặc thay thế dòng đó bằng Form).
- Trong Panel này sẽ có:
  - Input: Mã SKU
  - Input: Giá bán, Giá vốn
  - Khu vực quản lý Lô hàng: Liệt kê các lô hiện tại (Tên lô, Hạn dùng, Số lượng) và nút "Thêm lô mới".
  - Nút **Lưu lại** và **Hủy**.
  
## Xử lý Logic (JS)
- Viết một hàm window.openInlineVariantEditor(variantId, containerId) trong productUI.js.
- Hàm này sẽ fetch/tìm data của biến thể (Units, Batches).
- Render ra HTML Form và chèn vào containerId (có thể là một <tr> ẩn ngay dưới dòng biến thể ở bảng chính, hoặc một <div> trong Mục 6 của Modal).
- Cung cấp hàm window.saveInlineVariant(variantId) để đọc dữ liệu từ form này:
  - Gửi request trực tiếp đến Supabase (hoặc qua productService.js) để cập nhật products, product_units, và product_batches của biến thể đó.
  - Cập nhật lại UI sau khi lưu thành công (tắt form, re-render bảng/accordion).

## Các thay đổi chính:
1. **productUI.js**: 
   - Thêm hàm tạo HTML cho Inline Editor.
   - Sửa lại các nút "Sửa" của biến thể thay vì gọi openEditModalByCode thì gọi openInlineVariantEditor.
2. **productService.js** (Nếu cần):
   - Thêm hàm updateVariantInline(variantId, data) để xử lý việc lưu dữ liệu nhánh.

