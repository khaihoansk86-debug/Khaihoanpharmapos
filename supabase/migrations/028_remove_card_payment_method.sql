-- Migration 028: This pharmacy accepts only cash and bank transfer in POS flows.
UPDATE public.orders
SET payment_method = 'bank_transfer'
WHERE payment_method = 'card';

ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_method_check
CHECK (payment_method IN ('cash', 'bank_transfer', 'other'));

UPDATE public.cashbook_transactions
SET payment_method = 'bank_transfer'
WHERE payment_method = 'card';

ALTER TABLE public.cashbook_transactions
DROP CONSTRAINT IF EXISTS cashbook_transactions_payment_method_check;

ALTER TABLE public.cashbook_transactions
ADD CONSTRAINT cashbook_transactions_payment_method_check
CHECK (payment_method IN ('cash', 'bank_transfer', 'other'));
