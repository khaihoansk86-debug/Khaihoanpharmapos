-- 056_add_product_dosage_form_and_hapacol_packaging.sql
-- Tach nhom bien the chuyen mon (ham luong + dang bao che) khoi SKU quy cach.
-- Moi SKU van giu product_id, barcode, lo, gia va ton kho doc lap.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS dosage_form text;

COMMENT ON COLUMN public.products.dosage_form IS
    'Dang bao che dung de gom bien the tren giao dien, vi du: Vien nen, Bot pha uong.';

CREATE INDEX IF NOT EXISTS idx_products_parent_clinical_variant
    ON public.products(parent_id, concentration, dosage_form)
    WHERE parent_id IS NOT NULL;

UPDATE public.products
SET is_direct_sale = false
WHERE product_code = 'PARENT_HAPACOL';

-- Hapacol 650: hop 10 vi x 5 vien = 50 vien.
UPDATE public.products
SET concentration = '650mg',
    dosage_form = 'Viên nén',
    packaging_spec = 'Hộp 10 vỉ × 5 viên',
    variant_label = '650mg • Hộp 50 viên'
WHERE product_code = 'SP000910';

-- Hapacol 650: hop 10 vi x 10 vien = 100 vien.
UPDATE public.products
SET concentration = '650mg',
    dosage_form = 'Viên nén',
    packaging_spec = 'Hộp 10 vỉ × 10 viên',
    variant_label = '650mg • Hộp 100 viên'
WHERE product_code = 'SP187965';
