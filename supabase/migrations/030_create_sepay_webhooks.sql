-- Tạo bảng lưu trữ webhook từ SePay
CREATE TABLE IF NOT EXISTS public.sepay_webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id TEXT UNIQUE NOT NULL,     -- ID giao dịch bên SePay
    amount NUMERIC NOT NULL,                 -- Số tiền nhận được
    transfer_content TEXT NOT NULL,          -- Nội dung chuyển khoản
    order_code TEXT,                         -- Mã đơn hàng trích xuất được từ nội dung (ví dụ: HD...)
    bank_account TEXT,                       -- Số tài khoản nhận
    status TEXT DEFAULT 'pending',           -- Trạng thái: pending, processed
    raw_data JSONB,                          -- Toàn bộ data gốc từ SePay
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Bật RLS
ALTER TABLE public.sepay_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy cho phép ai cũng có thể đọc (để POS Realtime có thể nghe)
CREATE POLICY "Cho phép đọc sepay_webhooks cho tất cả" 
ON public.sepay_webhooks 
FOR SELECT 
USING (true);

-- Policy cho service_role / API insert
CREATE POLICY "Cho phép insert sepay_webhooks ẩn danh" 
ON public.sepay_webhooks 
FOR INSERT 
WITH CHECK (true);

-- Bật realtime cho bảng này để POS có thể nhận thông báo
ALTER PUBLICATION supabase_realtime ADD TABLE public.sepay_webhooks;
