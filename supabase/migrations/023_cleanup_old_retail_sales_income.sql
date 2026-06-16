-- Migration 023_cleanup_old_retail_sales_income.sql
-- Clean up all remaining automatic retail sales income transactions from the cashbook (handling accented and non-accented category variations).

DELETE FROM public.cashbook_transactions
WHERE ref_type = 'sales'
  AND type = 'income'
  AND category IN ('Doanh thu bán lẻ', 'Doanh thu ban le');
