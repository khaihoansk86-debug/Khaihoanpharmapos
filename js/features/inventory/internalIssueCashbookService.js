import { supabaseClient } from '../../core/supabase.js';
import { getInternalIssueTargetLabel } from './internalIssueMetadata.js';

const INTERNAL_ISSUE_CATEGORY = 'Xuất tiêu hao nội bộ';

function buildDescription({ documentCode, reason, targetType, targetName, note }) {
    const parts = [
        `Phiếu ${documentCode}`,
        reason ? `Lý do: ${reason}` : null,
        targetName ? `Đối tượng: ${getInternalIssueTargetLabel(targetType)} - ${targetName}` : null,
        note ? `Ghi chú: ${note}` : null
    ].filter(Boolean);
    return parts.join(' | ');
}

export async function upsertInternalIssueCashbookTransaction({
    documentId,
    documentCode,
    amount,
    transactionDate,
    reason,
    targetType,
    targetName,
    note
}) {
    if (!supabaseClient || !documentId || !documentCode) return null;

    const payload = {
        transaction_code: `PC-${documentCode}`,
        type: 'expense',
        amount: Math.max(0, Number(amount || 0)),
        category: INTERNAL_ISSUE_CATEGORY,
        ref_type: 'manual',
        ref_id: documentId,
        payment_method: 'other',
        description: buildDescription({ documentCode, reason, targetType, targetName, note }),
        performer: 'Hệ thống kho',
        status: 'completed',
        transaction_date: transactionDate || new Date().toISOString()
    };

    const { data, error } = await supabaseClient
        .from('cashbook_transactions')
        .upsert([payload], { onConflict: 'transaction_code' })
        .select()
        .maybeSingle();

    if (error) throw error;
    return data || null;
}

export async function cancelInternalIssueCashbookTransaction(documentId, reasonText = '') {
    if (!supabaseClient || !documentId) return;

    const { data: tx, error: findError } = await supabaseClient
        .from('cashbook_transactions')
        .select('id, description, status')
        .eq('ref_type', 'manual')
        .eq('ref_id', documentId)
        .eq('category', INTERNAL_ISSUE_CATEGORY)
        .maybeSingle();

    if (findError) throw findError;
    if (!tx || tx.status === 'cancelled') return;

    const description = [
        tx.description || '',
        reasonText ? `[HỦY PHIẾU: ${reasonText}]` : '[HỦY PHIẾU]'
    ].filter(Boolean).join(' ').trim();

    const { error } = await supabaseClient
        .from('cashbook_transactions')
        .update({
            status: 'cancelled',
            description,
            updated_at: new Date().toISOString()
        })
        .eq('id', tx.id);

    if (error) throw error;
}
