function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

export const PRODUCT_AI_OPERATION_GUIDES = Object.freeze({
    'retail-price': Object.freeze({
        label: 'Sửa giá bán',
        icon: 'fa-tags',
        commandTemplate: 'Sửa giá bán [tên mặt hàng] 20k',
        example: 'Sửa giá bán Panadol 20k',
        steps: Object.freeze([
            'Thay tên mặt hàng và mức giá cần bán.',
            'Gửi lệnh để mở sẵn biểu mẫu giá.',
            'Kiểm tra giá các đơn vị rồi bấm Lưu dữ liệu.'
        ])
    }),
    'cost-price': Object.freeze({
        label: 'Sửa giá vốn',
        icon: 'fa-coins',
        commandTemplate: 'Sửa giá vốn [tên mặt hàng] 15k',
        example: 'Sửa giá vốn Panadol 15k',
        steps: Object.freeze([
            'Thay tên mặt hàng và giá vốn chuẩn.',
            'Gửi lệnh để điền giá theo đơn vị quy đổi.',
            'Kiểm tra giá vốn từng lô rồi bấm Lưu dữ liệu.'
        ])
    }),
    'discard-batch': Object.freeze({
        label: 'Xuất bỏ lô',
        icon: 'fa-box-open',
        commandTemplate: 'Xuất bỏ lô L01 của [tên mặt hàng]',
        example: 'Xuất bỏ lô L01 của Panadol',
        steps: Object.freeze([
            'Thay đúng số lô và tên mặt hàng.',
            'Mở phiếu xuất bỏ đã được điền toàn bộ số tồn.',
            'Kiểm tra lý do rồi bấm Xác nhận xuất kho.'
        ])
    }),
    'inactive-product': Object.freeze({
        label: 'Ngừng kinh doanh',
        icon: 'fa-store-slash',
        commandTemplate: 'Ngừng kinh doanh [tên mặt hàng]',
        example: 'Ngừng kinh doanh Panadol',
        steps: Object.freeze([
            'Thay tên mặt hàng cần ngừng bán.',
            'Gửi lệnh để mở và đổi sẵn trạng thái.',
            'Kiểm tra tồn kho rồi bấm Lưu dữ liệu.'
        ])
    })
});

export function getProductAIOperationGuide(operationKey) {
    return PRODUCT_AI_OPERATION_GUIDES[String(operationKey || '').trim()] || null;
}

function parseMoneyToken(value) {
    const token = String(value || '').trim().toUpperCase();
    if (!token) return null;

    const multiplier = token.endsWith('K') ? 1000 : 1;
    const digits = token
        .replace(/K$/, '')
        .replace(/[.,\s]/g, '');
    if (!/^\d+$/.test(digits)) return null;

    const amount = Number(digits) * multiplier;
    return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

function extractPriceCommand(command, normalized) {
    const priceType = normalized.includes('GIA VON')
        ? 'cost'
        : (normalized.includes('GIA BAN') ? 'retail' : null);
    if (!priceType) return null;

    const moneyMatches = [...normalized.matchAll(/(?:^|\s)(\d[\d.,]*\s*K?)(?=\s|$)/g)];
    const moneyMatch = moneyMatches[moneyMatches.length - 1];
    const amount = parseMoneyToken(moneyMatch?.[1]);
    if (amount === null) return null;

    const marker = priceType === 'cost' ? 'GIA VON' : 'GIA BAN';
    const markerIndex = normalized.indexOf(marker);
    const priceIndex = moneyMatch.index + moneyMatch[0].indexOf(moneyMatch[1]);
    const beforeMarker = normalized.slice(0, markerIndex)
        .replace(/^(SUA|DOI|CAP NHAT|CHINH SUA)\s+/, '')
        .trim();
    const afterMarker = normalized.slice(markerIndex + marker.length, priceIndex)
        .replace(/^(CUA|CHO)\s+/, '')
        .replace(/\s+(THANH|LA|GIA)\s*$/, '')
        .trim();
    const productQuery = afterMarker || beforeMarker;

    if (!productQuery) return null;
    return {
        action: 'prepare_price',
        priceType,
        amount,
        productQuery,
        originalCommand: String(command || '').trim()
    };
}

export function parseProductAssistantCommand(command) {
    const normalized = normalizeText(command);
    if (!normalized) return null;

    const priceCommand = extractPriceCommand(command, normalized);
    if (priceCommand) return priceCommand;

    const discardMatch = normalized.match(
        /^(?:XUAT BO|XUAT HUY|XOA)\s+LO\s+(.+?)\s+(?:CUA|THUOC)\s+(.+)$/
    );
    if (discardMatch) {
        return {
            action: 'prepare_batch_discard',
            batchNumber: discardMatch[1].trim(),
            productQuery: discardMatch[2].trim(),
            originalCommand: String(command || '').trim()
        };
    }

    const inactiveMatch = normalized.match(
        /^(?:NGUNG KINH DOANH|NGUNG BAN|TAM NGUNG BAN)\s+(.+)$/
    );
    if (inactiveMatch) {
        return {
            action: 'prepare_inactive',
            productQuery: inactiveMatch[1].trim(),
            originalCommand: String(command || '').trim()
        };
    }

    return null;
}

export function buildAssistantInventoryIssueUrl({ productCode, batchId } = {}) {
    if (!String(productCode || '').trim() || !String(batchId || '').trim()) {
        throw new Error('Thiếu thông tin mặt hàng hoặc lô cần xuất bỏ.');
    }
    const params = new URLSearchParams({
        assistantAction: 'discard-batch',
        productCode: String(productCode).trim(),
        batchId: String(batchId).trim()
    });
    return `inventory.html?${params.toString()}#stock-issue`;
}

export function resolveAssistantBatch(product = {}, batchNumber = '') {
    const key = normalizeText(batchNumber);
    return (product.product_batches || []).find(
        batch => normalizeText(batch?.batch_number) === key
    ) || null;
}

export function formatAssistantMoney(amount) {
    return `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
}
