-- 058_add_product_variant_classification.sql
-- Luu truc phan loai cua nhom san pham tach biet voi quy cach dong goi SKU.
-- Parent co toi da hai truc phan loai; SKU con luu gia tri theo cac truc do.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS variant_definitions jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS variant_values jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_variant_definitions_shape,
    ADD CONSTRAINT products_variant_definitions_shape
        CHECK (
            jsonb_typeof(variant_definitions) = 'array'
            AND jsonb_array_length(variant_definitions) <= 2
        ),
    DROP CONSTRAINT IF EXISTS products_variant_values_shape,
    ADD CONSTRAINT products_variant_values_shape
        CHECK (jsonb_typeof(variant_values) = 'object');

COMMENT ON COLUMN public.products.variant_definitions IS
    'Toi da hai truc phan loai cua parent, vi du Ham luong + Dang bao che hoac Huong/Mui + Dung tich.';

COMMENT ON COLUMN public.products.variant_values IS
    'Gia tri phan loai cua SKU con; quy cach dong goi van luu rieng trong packaging_spec va product_units.';

CREATE INDEX IF NOT EXISTS idx_products_variant_values_gin
    ON public.products USING gin (variant_values);

UPDATE public.products
SET variant_definitions = '[
    {"key": "concentration", "label": "Hàm lượng"},
    {"key": "dosage_form", "label": "Dạng bào chế"}
]'::jsonb
WHERE product_code = 'PARENT_HAPACOL'
  AND variant_definitions = '[]'::jsonb;

UPDATE public.products child
SET variant_values = jsonb_strip_nulls(jsonb_build_object(
    'concentration', NULLIF(BTRIM(child.concentration), ''),
    'dosage_form', NULLIF(BTRIM(child.dosage_form), '')
))
FROM public.products parent
WHERE child.parent_id = parent.id
  AND parent.product_code = 'PARENT_HAPACOL'
  AND child.variant_values = '{}'::jsonb;
