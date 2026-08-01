-- Harden employee credentials, scheduling, templates and lifecycle without changing
-- payroll, revenue, inventory or report formulas.

-- Retire the obsolete browser credential bridge and remove retained SHA-256 hashes.
UPDATE public.employees SET password_hash = NULL WHERE password_hash IS NOT NULL;
DROP FUNCTION IF EXISTS public.authenticate_employee_legacy(TEXT, TEXT);

-- Existing clients may read only non-secret profile columns. Technical Auth linkage
-- remains available exclusively to service_role (which bypasses these grants).
REVOKE ALL ON public.employees FROM anon, authenticated;
GRANT SELECT (
    id, name, phone, daily_rate, commission_rate, status, created_at, updated_at,
    username, role, permissions, monthly_salary, monthly_allowance
) ON public.employees TO authenticated;
GRANT INSERT (
    name, phone, daily_rate, commission_rate, status, username, role, permissions,
    monthly_salary, monthly_allowance
) ON public.employees TO authenticated;
GRANT UPDATE (
    name, phone, daily_rate, commission_rate, status, username, role, permissions,
    monthly_salary, monthly_allowance, updated_at
) ON public.employees TO authenticated;

DROP POLICY IF EXISTS "Employees delete admin" ON public.employees;

-- Normalize the established two-shift vocabulary before enforcing it.
UPDATE public.employee_shifts
SET shift_name = CASE
    WHEN lower(trim(shift_name)) IN ('sáng', 'ca sáng') THEN 'Sáng'
    WHEN lower(trim(shift_name)) IN ('chiều', 'ca chiều') THEN 'Chiều'
    ELSE shift_name
END;

UPDATE public.employee_shifts
SET start_time = CASE WHEN shift_name = 'Sáng' THEN TIME '06:30' ELSE TIME '13:30' END,
    end_time = CASE WHEN shift_name = 'Sáng' THEN TIME '13:30' ELSE TIME '20:00' END
WHERE start_time IS NULL OR end_time IS NULL;

-- Close only completed historical worked shifts. Monetary values are untouched.
UPDATE public.employee_shifts
SET is_closed = TRUE,
    closed_at = ((shift_date::text || ' ' || end_time::text)::timestamp
        AT TIME ZONE 'Asia/Ho_Chi_Minh')
WHERE status = 'worked'
  AND is_closed = FALSE
  AND shift_date < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

ALTER TABLE public.employee_shifts
    ALTER COLUMN start_time SET NOT NULL,
    ALTER COLUMN end_time SET NOT NULL;

ALTER TABLE public.employee_shifts
    DROP CONSTRAINT IF EXISTS employee_shifts_valid_time,
    DROP CONSTRAINT IF EXISTS employee_shifts_allowed_name,
    DROP CONSTRAINT IF EXISTS employee_shifts_nonnegative_amounts,
    DROP CONSTRAINT IF EXISTS employee_shifts_note_length;

ALTER TABLE public.employee_shifts
    ADD CONSTRAINT employee_shifts_valid_time CHECK (start_time < end_time),
    ADD CONSTRAINT employee_shifts_allowed_name CHECK (shift_name IN ('Sáng', 'Chiều')),
    ADD CONSTRAINT employee_shifts_nonnegative_amounts CHECK (
        cash_amount >= 0 AND bank_amount >= 0 AND cash_exchange_amount >= 0
        AND sales_amount >= 0 AND out_of_shift_sales >= 0
    ),
    ADD CONSTRAINT employee_shifts_note_length CHECK (char_length(COALESCE(note, '')) <= 500);

ALTER TABLE public.employees
    DROP CONSTRAINT IF EXISTS employees_name_length,
    DROP CONSTRAINT IF EXISTS employees_phone_length;
ALTER TABLE public.employees
    ADD CONSTRAINT employees_name_length CHECK (char_length(trim(name)) BETWEEN 1 AND 150),
    ADD CONSTRAINT employees_phone_length CHECK (char_length(COALESCE(phone, '')) <= 30);

CREATE UNIQUE INDEX IF NOT EXISTS employee_shifts_employee_date_name_unique
    ON public.employee_shifts (employee_id, shift_date, lower(trim(shift_name)));

-- Employees may read their own shifts, but only admins/shift managers write rows.
DROP POLICY IF EXISTS "Employee shifts insert authorized scope" ON public.employee_shifts;
DROP POLICY IF EXISTS "Employee shifts update authorized scope" ON public.employee_shifts;

CREATE POLICY "Employee shifts insert managers"
    ON public.employee_shifts FOR INSERT TO authenticated
    WITH CHECK (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
    );

CREATE POLICY "Employee shifts update managers"
    ON public.employee_shifts FOR UPDATE TO authenticated
    USING (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
    )
    WITH CHECK (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
    );

-- Narrow POS seam: an employee can update only monetary totals of one own shift.
CREATE OR REPLACE FUNCTION public.sync_current_employee_shift_amounts(
    p_shift_id UUID,
    p_cash_amount NUMERIC,
    p_bank_amount NUMERIC,
    p_cash_exchange_amount NUMERIC,
    p_sales_amount NUMERIC,
    p_out_of_shift_sales NUMERIC
)
RETURNS SETOF public.employee_shifts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_employee_id UUID := public.current_employee_id();
BEGIN
    IF v_employee_id IS NULL OR p_shift_id IS NULL THEN
        RAISE EXCEPTION 'SHIFT_SYNC_FORBIDDEN' USING ERRCODE = '42501';
    END IF;
    IF p_cash_amount < 0 OR p_bank_amount < 0 OR p_cash_exchange_amount < 0
       OR p_sales_amount < 0 OR p_out_of_shift_sales < 0 THEN
        RAISE EXCEPTION 'INVALID_SHIFT_AMOUNT' USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    UPDATE public.employee_shifts
    SET cash_amount = p_cash_amount,
        bank_amount = p_bank_amount,
        cash_exchange_amount = p_cash_exchange_amount,
        sales_amount = p_sales_amount,
        out_of_shift_sales = p_out_of_shift_sales,
        updated_at = now()
    WHERE id = p_shift_id AND employee_id = v_employee_id
    RETURNING *;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHIFT_SYNC_FORBIDDEN' USING ERRCODE = '42501';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_current_employee_shift_amounts(
    UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_current_employee_shift_amounts(
    UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC
) TO authenticated;

-- Atomic and idempotent bulk scheduling for admins/shift managers.
CREATE OR REPLACE FUNCTION public.save_employee_shifts_bulk(p_shifts JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shift JSONB;
    v_count INTEGER;
    v_inserted INTEGER := 0;
    v_total INTEGER;
    v_name TEXT;
    v_start TIME;
    v_end TIME;
BEGIN
    IF NOT (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
    ) THEN
        RAISE EXCEPTION 'SHIFT_SCHEDULE_FORBIDDEN' USING ERRCODE = '42501';
    END IF;
    IF jsonb_typeof(p_shifts) <> 'array' THEN
        RAISE EXCEPTION 'INVALID_SHIFT_PAYLOAD' USING ERRCODE = '22023';
    END IF;
    v_total := jsonb_array_length(p_shifts);
    IF v_total < 1 OR v_total > 62 THEN
        RAISE EXCEPTION 'INVALID_SHIFT_RANGE' USING ERRCODE = '22023';
    END IF;

    FOR v_shift IN SELECT value FROM jsonb_array_elements(p_shifts)
    LOOP
        v_name := v_shift->>'shift_name';
        v_start := (v_shift->>'start_time')::time;
        v_end := (v_shift->>'end_time')::time;
        IF v_name NOT IN ('Sáng', 'Chiều') OR v_start >= v_end
           OR char_length(COALESCE(v_shift->>'note', '')) > 500
           OR (v_shift->>'status') NOT IN ('worked', 'off')
           OR COALESCE((v_shift->>'cash_amount')::numeric, 0) < 0
           OR COALESCE((v_shift->>'bank_amount')::numeric, 0) < 0
           OR COALESCE((v_shift->>'cash_exchange_amount')::numeric, 0) < 0
           OR COALESCE((v_shift->>'sales_amount')::numeric, 0) < 0
           OR COALESCE((v_shift->>'out_of_shift_sales')::numeric, 0) < 0 THEN
            RAISE EXCEPTION 'INVALID_SHIFT_PAYLOAD' USING ERRCODE = '22023';
        END IF;

        INSERT INTO public.employee_shifts (
            employee_id, shift_date, shift_name, start_time, end_time,
            cash_amount, bank_amount, cash_exchange_amount, sales_amount,
            out_of_shift_sales, status, note
        ) VALUES (
            (v_shift->>'employee_id')::uuid,
            (v_shift->>'shift_date')::date,
            v_name,
            v_start,
            v_end,
            COALESCE((v_shift->>'cash_amount')::numeric, 0),
            COALESCE((v_shift->>'bank_amount')::numeric, 0),
            COALESCE((v_shift->>'cash_exchange_amount')::numeric, 0),
            COALESCE((v_shift->>'sales_amount')::numeric, 0),
            COALESCE((v_shift->>'out_of_shift_sales')::numeric, 0),
            v_shift->>'status',
            NULLIF(trim(v_shift->>'note'), '')
        ) ON CONFLICT DO NOTHING;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        v_inserted := v_inserted + v_count;
    END LOOP;

    RETURN jsonb_build_object(
        'requested', v_total,
        'inserted', v_inserted,
        'skipped', v_total - v_inserted
    );
END;
$$;

REVOKE ALL ON FUNCTION public.save_employee_shifts_bulk(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_employee_shifts_bulk(JSONB) TO authenticated;

CREATE TABLE public.employee_shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    sort_order SMALLINT NOT NULL UNIQUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT employee_shift_templates_fixed_rows CHECK (
        (id = 'morning' AND name = 'Sáng' AND sort_order = 1)
        OR (id = 'afternoon' AND name = 'Chiều' AND sort_order = 2)
    ),
    CONSTRAINT employee_shift_templates_valid_time CHECK (start_time < end_time)
);

INSERT INTO public.employee_shift_templates (id, name, start_time, end_time, sort_order)
VALUES
    ('morning', 'Sáng', TIME '06:30', TIME '13:30', 1),
    ('afternoon', 'Chiều', TIME '13:30', TIME '20:00', 2)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.employee_shift_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shift templates read authenticated"
    ON public.employee_shift_templates FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Shift templates update managers"
    ON public.employee_shift_templates FOR UPDATE TO authenticated
    USING (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
    )
    WITH CHECK (
        public.current_employee_is_admin()
        OR public.current_employee_has_permission('manage_shifts')
    );

REVOKE ALL ON public.employee_shift_templates FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.employee_shift_templates TO authenticated;
GRANT UPDATE (start_time, end_time, updated_at) ON public.employee_shift_templates TO authenticated;

DROP TRIGGER IF EXISTS set_employee_shift_templates_updated_at
    ON public.employee_shift_templates;
CREATE TRIGGER set_employee_shift_templates_updated_at
BEFORE UPDATE ON public.employee_shift_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
