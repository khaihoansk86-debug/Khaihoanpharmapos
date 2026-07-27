-- 062_add_employee_auth_bridge.sql
-- Pha cầu nối: chuyển kiểm tra mật khẩu vào database và chuẩn bị liên kết
-- employees với Supabase Auth. Chưa thu hồi quyền anon trong migration này
-- để frontend cũ vẫn đăng nhập được trong thời gian triển khai chuyển tiếp.

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS auth_user_id UUID
        REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS auth_migrated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_auth_user_id
    ON public.employees(auth_user_id)
    WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.authenticate_employee_legacy(
    p_username TEXT,
    p_password_hash TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    username TEXT,
    role TEXT,
    status TEXT,
    permissions JSONB,
    auth_migration_ready BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        employee.id,
        employee.name,
        employee.username,
        employee.role,
        employee.status,
        COALESCE(employee.permissions, '[]'::JSONB),
        employee.auth_user_id IS NOT NULL
    FROM public.employees employee
    WHERE LOWER(BTRIM(employee.username)) = LOWER(BTRIM(p_username))
      AND employee.password_hash = LOWER(BTRIM(p_password_hash))
      AND employee.status = 'active'
      AND LENGTH(BTRIM(p_username)) BETWEEN 1 AND 100
      AND p_password_hash ~ '^[0-9a-fA-F]{64}$'
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.authenticate_employee_legacy(TEXT, TEXT)
    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.authenticate_employee_legacy(TEXT, TEXT)
    TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT employee.id
    FROM public.employees employee
    WHERE employee.auth_user_id = auth.uid()
      AND employee.status = 'active'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_employee_has_permission(
    required_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.employees employee
        WHERE employee.auth_user_id = auth.uid()
          AND employee.status = 'active'
          AND (
              employee.role = 'admin'
              OR COALESCE(employee.permissions, '[]'::JSONB)
                  ? required_permission
          )
    );
$$;

REVOKE ALL ON FUNCTION public.current_employee_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_employee_has_permission(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_employee_has_permission(TEXT)
    TO authenticated;
