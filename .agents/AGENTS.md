

## Lỗi Encoding UTF-8 trên Windows (RẤT QUAN TRỌNG)
- **KHÔNG SỬ DỤNG** các công cụ tự động như `replace_file_content` hay `multi_replace_file_content` để sửa các file chứa chuỗi tiếng Việt (như HTML, JS chứa text UI) trên máy tính này.
- Nguyên nhân: Môi trường Windows đọc ghi ngầm định bằng CP1252, làm hỏng (mojibake) toàn bộ chữ tiếng Việt có dấu trong file.
- **Cách khắc phục bắt buộc**: Bất cứ khi nào cần sửa code chứa tiếng Việt, AI **PHẢI** dùng `run_command` để chạy lệnh PowerShell với tham số `-Encoding UTF8`, hoặc chạy script Python với `open(..., encoding='utf-8')` để đảm bảo mã hóa không bị vỡ.

## Quy tắc Cẩn trọng và Kiểm thử (BẮT BUỘC)
- **KHÔNG LÀM CẨU THẢ**: Tuyệt đối không được phép tự suy diễn code (ảo hóa code) mà không tìm hiểu kỹ cấu trúc hiện tại của file hoặc dự án.
- **TỰ KIỂM TRA MÃ NGUỒN**: Sau khi viết hoặc sửa code, AI phải tự tìm cách xác minh tính toàn vẹn của mã nguồn (ví dụ: dùng grep để tìm những từ khóa liên quan xem có bị thiếu không, hoặc tự check logic).
- **CHỈ BÁO CÁO KHI ĐÃ HOÀN TẤT VÀ CHẮC CHẮN**: Không được báo cáo công việc hoàn tất khi thực tế tính năng chưa hoạt động đúng hoặc chỉ mới viết được một nửa. Luôn kiểm tra kỹ lưỡng (dry run) logic trước khi phản hồi người dùng.
