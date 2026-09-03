-- Canonicalize unit labels in the product catalog after older imports used
-- “vi”, “vĩ” and “vỉ”.  Quantities, rates and prices are untouched.
-- Historical order snapshots remain immutable; the application normalizes
-- those labels at display/payload boundaries.

UPDATE public.product_units
SET unit_name = CASE LOWER(BTRIM(unit_name))
    WHEN 'viên' THEN 'Viên'
    WHEN 'vi' THEN 'Vỉ'
    WHEN 'vỉ' THEN 'Vỉ'
    WHEN 'vĩ' THEN 'Vỉ'
    WHEN 'hộp' THEN 'Hộp'
    WHEN 'lọ' THEN 'Lọ'
    ELSE BTRIM(unit_name)
END
WHERE BTRIM(unit_name) <> CASE LOWER(BTRIM(unit_name))
    WHEN 'viên' THEN 'Viên'
    WHEN 'vi' THEN 'Vỉ'
    WHEN 'vỉ' THEN 'Vỉ'
    WHEN 'vĩ' THEN 'Vỉ'
    WHEN 'hộp' THEN 'Hộp'
    WHEN 'lọ' THEN 'Lọ'
    ELSE BTRIM(unit_name)
END;
