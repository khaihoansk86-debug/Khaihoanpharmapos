# Hợp đồng logic lõi PharmaPOS

Tài liệu này xác định phần nghiệp vụ đã ổn định. Mục tiêu là cho phép bổ sung tính năng mà không làm thay đổi âm thầm hành vi đang chạy.

## Hành vi phải được giữ nguyên

### POS và hóa đơn

- Loại đơn hàng được xác định tập trung bởi `orderRules.js`.
- Đơn bán lẻ, thuốc liều, nội bộ và thương mại điện tử phải giữ nguyên cách phân loại hiện tại.
- Việc tạo, trả, thay thế và hủy đơn phải tiếp tục đi qua `orderService.js`.
- Dòng nguyên liệu thuốc liều phải trừ tồn; gói thuốc liều ảo không được trừ tồn như hàng vật lý.

### Kho và nhập hàng

- Nhập kho làm tăng tồn theo đơn vị cơ sở, lô và hạn dùng.
- Xuất kho và hoàn kho phải giữ đúng dấu số lượng và giá vốn.
- Chứng từ kho và lịch sử biến động phải tiếp tục được ghi qua `inventoryService.js`.
- Giao diện có thể thêm bộ lọc, nhãn hoặc cách tìm kiếm nhưng không được tự viết lại nghiệp vụ cộng/trừ tồn.

### Sản phẩm

- Sản phẩm, đơn vị quy đổi và lô hàng tiếp tục dùng các hàm trong `productService.js`.
- Cờ trong `description`, gồm `is_dose_cut` và `is_dose_retail`, là dữ liệu tương thích ngược.
- Không đổi ý nghĩa mã `DOSE-`, đơn vị cơ sở hoặc tỷ lệ quy đổi nếu chưa có kế hoạch migration dữ liệu.

### Ca làm việc và thanh toán

- Cách chọn ca, cộng tiền theo phương thức và hoàn tác thanh toán được giữ trong các module `shift*`.
- Tính năng mới không được cập nhật trực tiếp số tiền ca nếu đã có service đồng bộ tương ứng.

### Báo cáo

- Báo cáo phải đọc cùng quy ước phân loại đơn hàng, doanh thu, giá vốn và nguyên liệu như POS.
- Không tạo quy tắc phân loại riêng trong controller báo cáo.

### Cơ sở dữ liệu

- Migration đã tồn tại là bất biến.
- Mọi thay đổi schema dùng migration mới, có khả năng chạy nối tiếp trên dữ liệu đang vận hành.

## Mẫu mở rộng được chấp nhận

1. Viết rule thuần và test rule đó.
2. Tạo service/adapter mới bao quanh service lõi.
3. Gọi extension từ controller hoặc điểm tích hợp nhỏ.
4. Giữ payload và kết quả mặc định tương thích với hành vi cũ.

Ví dụ: thêm kênh bán mới nên bổ sung rule nhận diện kênh và truyền context vào `orderService`; không sao chép toàn bộ hàm tạo đơn rồi sửa riêng.

## Khi nào được thay đổi logic lõi

Chỉ thay đổi khi có một trong các điều kiện:

- Sửa lỗi đã được xác nhận.
- Yêu cầu nghiệp vụ nói rõ hành vi cũ cần đổi.
- Migration hoặc tái cấu trúc đã được phê duyệt.

Khi đó pull request phải mô tả hành vi cũ, hành vi mới, ảnh hưởng dữ liệu và test hồi quy.

## Kiểm tra bắt buộc

```powershell
npm.cmd test -- --runInBand
```

Nếu thay đổi JavaScript ngoài phạm vi test trực tiếp, chạy thêm:

```powershell
node --check <duong-dan-file>
```
