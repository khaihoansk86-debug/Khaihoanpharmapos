import { supabaseClient } from '../../core/supabase.js';

/**
 * Commit a purchase document, its lot updates and movement snapshots through
 * the database transaction. The document code is deliberately supplied by
 * the caller and persisted in the draft so a retry is idempotent.
 */
export async function createPurchaseReceiptAtomic({
    documentCode,
    note,
    supplierId,
    totalAmount,
    paidAmount,
    debtAmount,
    reason,
    lines
}) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    if (!documentCode) throw new Error('Phiếu nhập chưa có mã chứng từ.');
    if (!Array.isArray(lines) || lines.length === 0) {
        throw new Error('Phiếu nhập phải có ít nhất một mặt hàng.');
    }

    const { data, error } = await supabaseClient.rpc('create_purchase_document_atomic', {
        p_document_code: documentCode,
        p_note: note || null,
        p_supplier_id: supplierId || null,
        p_total_amount: Number(totalAmount || 0),
        p_paid_amount: Number(paidAmount || 0),
        p_debt_amount: Number(debtAmount || 0),
        p_reason: reason || 'purchase',
        p_lines: lines
    });

    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.document_id) {
        throw new Error('Máy chủ không trả về mã phiếu nhập đã ghi.');
    }
    return result;
}
