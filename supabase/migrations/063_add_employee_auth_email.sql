-- 063_add_employee_auth_email.sql
-- Lưu định danh email kỹ thuật của Supabase Auth. Không chứa email cá nhân
-- và được tạo từ SHA-256 của username để client có thể đăng nhập ổn định.

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS auth_email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_auth_email
    ON public.employees(LOWER(auth_email))
    WHERE auth_email IS NOT NULL;
