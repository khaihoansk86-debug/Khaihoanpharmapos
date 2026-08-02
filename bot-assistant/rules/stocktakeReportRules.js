const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function assertDateKey(dateKey) {
    const value = String(dateKey || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Ngày báo cáo phải có định dạng YYYY-MM-DD.');
    }
    const [year, month, day] = value.split('-').map(Number);
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCFullYear() !== year
        || probe.getUTCMonth() !== month - 1
        || probe.getUTCDate() !== day) {
        throw new Error('Ngày báo cáo không hợp lệ.');
    }
    return { year, month, day };
}

export function getVietnamDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: VIETNAM_TIME_ZONE,
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

export function getVietnamDayRange(dateKey) {
    const { year, month, day } = assertDateKey(dateKey);
    const startMs = Date.UTC(year, month - 1, day) - 7 * 60 * 60 * 1000;
    return {
        start: new Date(startMs).toISOString(),
        end: new Date(startMs + 24 * 60 * 60 * 1000).toISOString()
    };
}

function formatDateLabel(dateKey) {
    const { day, month, year } = assertDateKey(dateKey);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

export function buildStocktakeReportMessage({ dateKey, documents = [], error = null } = {}) {
    let message = `📊 BÁO CÁO PHIẾU KIỂM KHO — ${formatDateLabel(dateKey)}\n\n`;
    if (error) {
        return message
            + '⚠️ Không thể đọc dữ liệu phiếu kiểm kho. Đây là lỗi hệ thống; '
            + 'không kết luận là ngày này không có phiếu.\n';
    }
    if (documents.length === 0) {
        return message + 'Không có Phiếu kiểm kho nào được lập trong ngày này.\n';
    }

    message += `Tổng số phiếu đã lập: ${documents.length}\n\n`;
    documents.forEach(document => {
        message += `[Phiếu: ${document.document_code}] - Ghi chú: ${document.note || 'Trống'}\n`;
        const items = Array.isArray(document.inventory_document_items)
            ? document.inventory_document_items
            : [];
        if (items.length === 0) {
            message += '  ⚠️ Phiếu chưa có dữ liệu chi tiết mặt hàng.\n\n';
            return;
        }

        let hasDiscrepancy = false;
        items.forEach(item => {
            const expected = Number(item.quantity_base || 0);
            const counted = Number(item.counted_quantity_base || 0);
            const difference = counted - expected;
            if (difference === 0) return;
            hasDiscrepancy = true;
            const sign = difference > 0 ? '+' : '';
            const productName = item.products?.name || 'Không rõ mặt hàng';
            message += `  ⚠️ Lệch: ${productName} (Phần mềm: ${expected}, Đếm: ${counted} -> Lệch: ${sign}${difference})\n`;
        });
        if (!hasDiscrepancy) {
            message += '  ✅ Tất cả mặt hàng trong phiếu đều khớp số lượng phần mềm.\n';
        }
        message += '\n';
    });
    return message;
}
