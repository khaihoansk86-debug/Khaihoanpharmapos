/**
 * ==========================================
 * LÕI NGHIỆP VỤ - CORE LOGIC CONTRACT
 * ==========================================
 * Các hàm trong tệp này thuộc Core Logic của hệ thống PharmaPOS.
 * KHÔNG ĐƯỢC PHÉP CHỈNH SỬA HÀNH VI TÍNH TOÁN HIỆN TẠI (định dạng, tổng, tồn kho, v.v)
 * trừ khi có yêu cầu rõ ràng từ người dùng để thay đổi Core Logic.
 * Thay vào đó, hãy mở rộng thông qua các helper/adapter bên ngoài.
 * Đọc thêm: docs/core-logic-contract.md
 * ==========================================
 */
export function isDoseReportLine(item = {}, lookups = {}) {
    const productId = item.product_id;
    const productCode = String(item.product_code || item.code || '');

    return lookups.isDoseProductMap?.get(productId) === true
        || lookups.isDoseRetailMap?.get(productId) === true
        || productCode.startsWith('DOSE-');
}

export function isDosePackageSaleLine(item = {}, lookups = {}, isDoseOrderItem = false, revenue = 0) {
    const productId = item.product_id;
    const productCode = String(item.product_code || item.code || '');
    const isDoseRetailPackage = lookups.isDoseRetailMap?.get(productId) === true
        || productCode.startsWith('DOSE-');

    return isDoseRetailPackage;
}

export function getDoseProductPerformanceValues({ revenue = 0, cost = 0, profit = 0, isDosePackageSale = false } = {}) {
    if (isDosePackageSale) {
        return {
            cost: 0,
            profit: Number(revenue || 0)
        };
    }

    return {
        cost: Number(cost || 0),
        profit: Number(profit || 0)
    };
}

export function shouldCountMissingCostForReportLine({ costSource = '', isDosePackageSale = false } = {}) {
    return costSource === 'missing' && isDosePackageSale !== true;
}

