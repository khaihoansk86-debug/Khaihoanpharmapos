-- Record the authenticated PharmaPOS user who creates and confirms inventory
-- documents. Identity comes from auth.uid(), never from browser-supplied names.

CREATE OR REPLACE FUNCTION public.stamp_inventory_document_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_user_id UUID := auth.uid();
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF v_auth_user_id IS NOT NULL THEN
            NEW.created_by := v_auth_user_id;
            IF NEW.status = 'confirmed' THEN
                NEW.confirmed_by := v_auth_user_id;
            END IF;
        END IF;
    ELSIF NEW.status = 'confirmed'
       AND OLD.status IS DISTINCT FROM 'confirmed'
       AND v_auth_user_id IS NOT NULL THEN
        NEW.confirmed_by := v_auth_user_id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stamp_inventory_document_staff()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_stamp_inventory_document_staff
    ON public.inventory_documents;
CREATE TRIGGER tr_stamp_inventory_document_staff
BEFORE INSERT OR UPDATE OF status ON public.inventory_documents
FOR EACH ROW
EXECUTE FUNCTION public.stamp_inventory_document_staff();

CREATE INDEX IF NOT EXISTS idx_inventory_documents_created_by
    ON public.inventory_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_documents_confirmed_by
    ON public.inventory_documents(confirmed_by);
