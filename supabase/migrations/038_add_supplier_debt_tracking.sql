-- Add debt tracking columns to inventory_documents
ALTER TABLE inventory_documents
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS debt_amount DECIMAL(15,2) DEFAULT 0;

-- Create view for supplier debts
CREATE OR REPLACE VIEW view_supplier_debts AS
SELECT 
    d.id as document_id, 
    d.document_code, 
    d.confirmed_at,
    d.supplier_id, 
    s.name as supplier_name, 
    s.supplier_code,
    d.total_amount, 
    d.paid_amount, 
    d.debt_amount
FROM inventory_documents d
LEFT JOIN suppliers s ON d.supplier_id = s.id
WHERE d.document_type = 'purchase' 
  AND d.debt_amount > 0 
  AND d.status != 'cancelled';
