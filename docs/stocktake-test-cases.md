# Danh sách Kiểm thử Nghiệp vụ Kiểm Kê (Stocktake Test Cases)

Đây là tài liệu cố định ghi nhận các luồng nghiệp vụ cốt lõi của tính năng Kiểm Kê Kho. Các luồng này đã được thiết kế hoàn thiện (Mobile-First) và ổn định, **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP CHỈNH SỬA HAY XÓA BỎ TRONG CÁC LẦN REFACTOR TƯƠNG LAI**.

## 1. Tải và Hiển thị Dữ Liệu
- [ ] **Hiển thị mặc định:** Giao diện thẻ (Card layout) load thành công, liệt kê các sản phẩm đang có Tồn kho > 0.
- [ ] **Tìm kiếm (Live Search):** Nhập ký tự vào ô tìm kiếm, danh sách tự động lọc realtime và chỉ hiện các thẻ có tên hoặc mã khớp.

## 2. Nhập số lượng thực tế
- [ ] **Nhập lệch âm/dương:** Nhập số đếm thực tế. Xác nhận ô số, dòng báo độ lệch, thẻ tổng sản phẩm và thanh tổng cộng dưới footer đều tính toán chuẩn xác và đổi màu tương ứng (Đỏ: thiếu, Xanh: dư).
- [ ] **Xóa trắng (Clear input):** Khi xóa trắng ô nhập liệu, hệ thống tự động trả về bằng số Tồn PM (coi như không lệch).
- [ ] **Mobile UX:** Chạm vào ô nhập liệu phải hiện bàn phím số (Numpad). Khi ấn Enter trên bàn phím, con trỏ tự động nhảy xuống và bôi đen ô bên dưới.

## 3. Thao tác nâng cao trên Lô (Batches)
- [ ] **Sửa thông tin Lô:** Sửa trực tiếp "Tên lô" và "Hạn sử dụng" trên ô input. Khi lưu, bảng `product_batches` phải update được tên mới và áp dụng cho các lần xuất bán sau.
- [ ] **Thêm lô mới trực tiếp:** Nhấn nút `[+ Thêm lô thực tế]`. Một lô mới trống thông tin xuất hiện. Nhập tên, HSD, số lượng đếm. Khi chốt phiếu, hệ thống gọi đúng logic `insert` lô mới vào `product_batches` thay vì văng lỗi thiếu ID.

## 4. An toàn dữ liệu (Auto-save & Log)
- [ ] **Ghi nhận Nhật ký (Activity Log):** Mở bảng Drawer bên phải. Mọi thao tác đổi số lượng, thêm lô, sửa tên đều được đẩy vào danh sách lịch sử realtime kèm icon và thời gian. Thanh Progress đếm đúng số lô đã thao tác.
- [ ] **Phục hồi phiên dở dang:** Tải lại trang (F5) khi đang kiểm kê dở. Hiện Popup xác nhận. Chọn "Tiếp tục", toàn bộ số lượng đang nhập, các lô mới tự thêm và cả danh sách Nhật ký đều được phục hồi 100%.

## 5. Chốt phiếu và Lưu Database
- [ ] **Ghi nhận Phiếu:** Bấm Xác nhận. Document được tạo với loại `stocktake_adjustment`.
- [ ] **Báo cáo kho (Movements):** Log thẻ kho (`inventory_movements`) ghi chú đầy đủ lượng chênh lệch (âm/dương/lô mới). Lô bị đếm về 0 sẽ bị xóa cứng (hoặc gán tồn = 0 nếu vướng khóa ngoại).
