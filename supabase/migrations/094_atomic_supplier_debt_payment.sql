-- Record supplier debt payments atomically and create a cashbook expense.
CREATE OR REPLACE FUNCTION public.pay_supplier_debt_atomic(
    p_document_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT DEFAULT 'cash'
)
RETURNS TABLE (document_id UUID, paid_amount NUMERIC, debt_amount NUMERIC, transaction_id UUID)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_document public.inventory_documents%ROWTYPE;
    v_employee_id UUID := public.current_employee_id();
    v_employee_name TEXT;
    v_supplier_name TEXT;
    v_new_paid NUMERIC(14, 2);
    v_new_debt NUMERIC(14, 2);
    v_transaction_id UUID;
    v_transaction_code TEXT;
BEGIN
    IF v_employee_id IS NULL THEN
        RAISE EXCEPTION 'Employee authentication is required' USING ERRCODE = '42501';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero' USING ERRCODE = '22023';
    END IF;
    IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash', 'bank_transfer', 'card', 'other') THEN
        RAISE EXCEPTION 'Invalid payment method' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_document
    FROM public.inventory_documents
    WHERE id = p_document_id AND document_type = 'purchase' AND status = 'confirmed'
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Confirmed purchase document was not found' USING ERRCODE = 'P0002';
    END IF;
    IF p_amount > COALESCE(v_document.debt_amount, 0) THEN
        RAISE EXCEPTION 'Payment exceeds current supplier debt' USING ERRCODE = '22023';
    END IF;
    v_new_paid := round(COALESCE(v_document.paid_amount, 0) + p_amount, 2);
    v_new_debt := round(greatest(0, COALESCE(v_document.total_amount, 0) - v_new_paid), 2);
    UPDATE public.inventory_documents
    SET paid_amount = v_new_paid, debt_amount = v_new_debt, updated_at = now()
    WHERE id = p_document_id;
    SELECT name INTO v_supplier_name FROM public.suppliers WHERE id = v_document.supplier_id;
    SELECT name INTO v_employee_name FROM public.employees WHERE id = v_employee_id;
    v_transaction_code := 'PC-TT-' || v_document.document_code || '-' ||
        replace(to_char(v_new_paid, 'FM999999999999990.00'), '.', '_');
    INSERT INTO public.cashbook_transactions (
        transaction_code, type, amount, category, ref_type, ref_id,
        payment_method, description, performer, status, transaction_date
    ) VALUES (
        v_transaction_code, 'expense', p_amount, 'Thanh toán công nợ nhập hàng',
        'manual', p_document_id, p_payment_method,
        'Thanh toán công nợ phiếu ' || v_document.document_code || COALESCE(' - ' || v_supplier_name, ''),
        v_employee_name, 'completed', now()
    ) RETURNING id INTO v_transaction_id;
    RETURN QUERY SELECT p_document_id, v_new_paid, v_new_debt, v_transaction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pay_supplier_debt_atomic(UUID, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_supplier_debt_atomic(UUID, NUMERIC, TEXT) TO authenticated;
