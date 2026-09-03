# Audit dữ liệu nhóm sản phẩm/SKU — 03/09/2026

Đây là kết quả đọc production, không có thao tác sửa, gộp hoặc xóa dữ liệu.

## Kết quả

- Tổng sản phẩm: 580.
- Nhóm cha: 5.
- SKU con: 18.
- SKU không khớp `variant_definitions` của cha: 2.
- Nhóm có nhiều SKU legacy cùng để trống định danh phân loại/quy cách: 5.

Hai SKU thiếu giá trị phân loại thuộc `PARENT_HAPACOL`: `SP001812`, `SP001844`.

Các nhóm cần đối chiếu thủ công trước khi thiết lập định danh duy nhất:

- `PARENT_DECOLGEN`: `SP000899`, `SP001639`.
- `PARENT_HAPACOL`: `SP001812`, `SP001844`.
- `PARENT_PANADOL`: `SP000942`, `SP001319`, `SP001323`, `SP084804`.
- `PARENT_SALONPAS`: `SP000550`, `SP000843`.
- `PARENT_STREPSILS`: `9556108211332`, `SP000001`, `SP001135`, `SP001137`, `SP001139`, `SP001144`.

## Quy tắc xử lý

Không tự động gộp hoặc xóa các SKU trên vì mã hàng, barcode, lô và lịch sử giao dịch có thể khác nhau. Cần đối chiếu lần lượt tên hàng, barcode, đơn vị, quy cách, lô và lịch sử bán rồi mới điền `variant_values`/`packaging_spec`.

Migration 103 chỉ bắt buộc dữ liệu hợp lệ đối với SKU mới hoặc khi chủ động thay đổi định danh. Dòng legacy thiếu định danh vẫn có thể sửa các trường không liên quan; vì vậy triển khai migration không ép sửa hàng loạt và không làm mất lịch sử.

## Đối chiếu báo cáo

`reportService.js` chỉ tải thông tin sản phẩm theo `product_id` đã có trong giao dịch khi tính doanh thu/giá vốn. Phần gợi ý tồn kho có đọc toàn danh mục, nhưng chỉ đưa hàng có tồn thực tế vào các nhóm cảnh báo; dòng cha không có lô/tồn nên không bị cộng thêm. Chưa phát hiện đường tính doanh thu hoặc giá trị tồn nào cộng trùng dòng cha với SKU con.
