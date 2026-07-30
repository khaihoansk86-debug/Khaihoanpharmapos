const MAX_PAYLOAD_BYTES = 64 * 1024;
const MAX_TRANSACTION_ID_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;
const MAX_BANK_ACCOUNT_LENGTH = 200;
const MAX_AMOUNT = 1_000_000_000_000;

function cleanText(value, maxLength) {
    return String(value ?? '').trim().slice(0, maxLength);
}

export function getSePayWebhookAuthFailure(expectedToken, authorizationHeader) {
    const token = String(expectedToken || '').trim();
    if (!token) {
        return {
            status: 503,
            error: 'Server configuration error.'
        };
    }
    if (String(authorizationHeader || '') !== `Bearer ${token}`) {
        return {
            status: 401,
            error: 'Unauthorized'
        };
    }
    return null;
}

export function buildSePayWebhookRecord(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return {
            ok: false,
            error: 'Invalid payload'
        };
    }

    let payloadSize = 0;
    try {
        payloadSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    } catch {
        return {
            ok: false,
            error: 'Invalid payload'
        };
    }
    if (payloadSize > MAX_PAYLOAD_BYTES) {
        return {
            ok: false,
            error: 'Payload too large'
        };
    }

    const rawTransactionId = String(payload.id ?? payload.transaction_id ?? '').trim();
    const transactionId = cleanText(rawTransactionId, MAX_TRANSACTION_ID_LENGTH);
    const amount = Number(payload.amount ?? payload.transferAmount);
    const transferType = String(payload.transferType ?? payload.transfer_type ?? '')
        .trim()
        .toLowerCase();
    if (!transactionId
        || rawTransactionId.length > MAX_TRANSACTION_ID_LENGTH
        || !Number.isFinite(amount)
        || amount <= 0
        || amount > MAX_AMOUNT
        || (transferType && transferType !== 'in')) {
        return {
            ok: false,
            error: 'Invalid payload missing id or amount'
        };
    }

    const content = cleanText(
        payload.content ?? payload.transferContent ?? payload.description,
        MAX_CONTENT_LENGTH
    );
    const bankAccount = cleanText(
        payload.bank_account ?? payload.gateway,
        MAX_BANK_ACCOUNT_LENGTH
    );
    const orderMatch = content.match(/\b(TT[A-Z0-9]{6}|(?:HD|PX|XTMDT|TH)\d{12,16})\b/i);

    return {
        ok: true,
        record: {
            transaction_id: transactionId,
            amount,
            transfer_content: content,
            order_code: orderMatch ? orderMatch[0].toUpperCase() : null,
            bank_account: bankAccount,
            raw_data: payload,
            status: 'pending'
        }
    };
}
