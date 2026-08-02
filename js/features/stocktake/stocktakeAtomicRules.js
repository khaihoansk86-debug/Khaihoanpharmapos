function cleanText(value) {
    return String(value ?? '').trim();
}

function toNonNegativeNumber(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
        throw new Error(`${label} không hợp lệ.`);
    }
    return number;
}

export function buildAtomicStocktakePayload({ note = '', reason = 'stocktake', lines = [] } = {}) {
    if (!Array.isArray(lines) || lines.length === 0) {
        throw new Error('Phiếu kiểm kê cần ít nhất một dòng hàng hóa.');
    }

    return {
        p_note: cleanText(note) || null,
        p_reason: cleanText(reason) || 'stocktake',
        p_lines: lines.map((line, index) => {
            const productId = cleanText(line?.productId);
            const batchId = cleanText(line?.batchId) || null;
            const isNewBatch = line?.isNewBatch === true || !batchId;
            if (!productId) throw new Error(`Dòng ${index + 1} thiếu hàng hóa.`);

            const countedQuantity = toNonNegativeNumber(
                line?.countedQuantity ?? line?.quantity,
                `Số lượng thực đếm dòng ${index + 1}`
            );
            const batchNumber = cleanText(line?.batchNumber);
            if (isNewBatch && !batchNumber) {
                throw new Error(`Dòng ${index + 1} thiếu số lô mới.`);
            }

            return {
                product_id: productId,
                product_name: cleanText(line?.productName),
                product_code: cleanText(line?.productCode),
                batch_id: batchId,
                batch_number: batchNumber,
                expiry_date: cleanText(line?.expiryDate) || null,
                counted_quantity: countedQuantity,
                cost_price: toNonNegativeNumber(line?.costPrice ?? 0, `Giá vốn dòng ${index + 1}`),
                is_new_batch: isNewBatch,
                is_renamed: line?.isRenamed === true
            };
        })
    };
}
