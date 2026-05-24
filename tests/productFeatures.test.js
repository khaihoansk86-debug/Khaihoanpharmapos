/**
 * tests/productFeatures.test.js
 * 
 * Test suite cho các business logic cốt lõi của KhaiHoan PharmaPos.
 * Viết bằng JS thuần (không dùng TypeScript) để tương thích với Jest config hiện tại.
 */

// =====================================================
// UNIT TESTS: Logic tính toán không cần DOM / Supabase
// =====================================================

describe('Price formatting & calculation', () => {
    // Hàm VND format tương tự posUI.js
    const vnd = (v) => new Intl.NumberFormat('vi-VN').format(v || 0) + 'đ';

    test('vnd() formats zero correctly', () => {
        expect(vnd(0)).toBe('0đ');
    });

    test('vnd() formats typical pharmacy price', () => {
        const result = vnd(20000);
        expect(result).toContain('20');
        expect(result).toContain('đ');
    });

    test('vnd() handles undefined/null as 0', () => {
        expect(vnd(undefined)).toBe('0đ');
        expect(vnd(null)).toBe('0đ');
    });
});

describe('Cart total calculation', () => {
    function calcSubtotal(cart) {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    test('empty cart returns 0', () => {
        expect(calcSubtotal([])).toBe(0);
    });

    test('single item subtotal', () => {
        const cart = [{ price: 20000, quantity: 3 }];
        expect(calcSubtotal(cart)).toBe(60000);
    });

    test('multiple items subtotal', () => {
        const cart = [
            { price: 10000, quantity: 2 },
            { price: 50000, quantity: 1 },
            { price: 5000,  quantity: 4 }
        ];
        expect(calcSubtotal(cart)).toBe(90000);
    });

    test('ingredient items (price=0) do not affect total', () => {
        const cart = [
            { price: 25000, quantity: 1, isIngredient: false },
            { price: 0,     quantity: 5, isIngredient: true  }
        ];
        expect(calcSubtotal(cart)).toBe(25000);
    });
});

describe('Order code generation format', () => {
    // Giống hàm generateOrderCode() trong orderService.js
    function generateOrderCode() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.getTime().toString().slice(-4);
        return `HD${dateStr}${timeStr}`;
    }

    function generateReturnOrderCode() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.getTime().toString().slice(-4);
        return `TH${dateStr}${timeStr}`;
    }

    test('order code starts with HD', () => {
        expect(generateOrderCode()).toMatch(/^HD/);
    });

    test('return order code starts with TH', () => {
        expect(generateReturnOrderCode()).toMatch(/^TH/);
    });

    test('order code contains today date (YYYYMMDD format)', () => {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        expect(generateOrderCode()).toContain(today);
    });

    test('order code has correct total length (HD + 8 date + 4 time = 14)', () => {
        expect(generateOrderCode()).toHaveLength(14);
    });
});

describe('Vietnamese text normalization (removeVietnameseTones)', () => {
    // Hàm normalize giống posController.js
    function removeVietnameseTones(str) {
        if (!str) return '';
        return String(str).normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    function normalizeKey(value) {
        return value == null ? '' : removeVietnameseTones(String(value)).trim().toUpperCase();
    }

    test('removes tones from common pharmacy terms', () => {
        expect(normalizeKey('Panadol Extra')).toBe('PANADOL EXTRA');
    });

    test('converts đ → d', () => {
        expect(normalizeKey('đau đầu')).toBe('DAU DAU');
    });

    test('handles empty/null gracefully', () => {
        expect(normalizeKey(null)).toBe('');
        expect(normalizeKey('')).toBe('');
        expect(normalizeKey(undefined)).toBe('');
    });

    test('search matching works correctly', () => {
        const query = normalizeKey('panadol');
        const productName = normalizeKey('Panadol Extra Sức Mạnh');
        expect(productName.includes(query)).toBe(true);
    });

    test('search does not match unrelated product', () => {
        const query = normalizeKey('vitamin c');
        const productName = normalizeKey('Panadol Extra');
        expect(productName.includes(query)).toBe(false);
    });
});

describe('Quantity validation logic (cart)', () => {
    function clampQuantity(current, delta, isReturnItem, maxReturnQty, isPOSEditMode) {
        const minQty = (isPOSEditMode || isReturnItem) ? 0 : 1;
        const maxQty = isReturnItem ? Number(maxReturnQty || 0) : Infinity;
        return Math.min(maxQty, Math.max(minQty, current + delta));
    }

    test('normal sale: quantity cannot go below 1', () => {
        expect(clampQuantity(1, -1, false, null, false)).toBe(1);
    });

    test('edit mode: quantity can go to 0', () => {
        expect(clampQuantity(1, -1, false, null, true)).toBe(0);
    });

    test('return item: quantity cannot exceed original', () => {
        expect(clampQuantity(3, 5, true, 5, false)).toBe(5);
    });

    test('return item: quantity cannot go below 0', () => {
        expect(clampQuantity(0, -1, true, 5, false)).toBe(0);
    });

    test('normal sale: can add quantity freely', () => {
        expect(clampQuantity(10, 5, false, null, false)).toBe(15);
    });
});

describe('Customer phone detection', () => {
    // Logic từ posController.js processPayment
    function isPhoneNumber(value) {
        return /^\d+$/.test((value || '').replace(/\s/g, '')) && (value || '').length >= 9;
    }

    test('valid 10-digit phone', () => {
        expect(isPhoneNumber('0987654321')).toBe(true);
    });

    test('valid 9-digit phone', () => {
        expect(isPhoneNumber('098765432')).toBe(true);
    });

    test('name is not a phone', () => {
        expect(isPhoneNumber('Nguyễn Văn A')).toBe(false);
    });

    test('short number is not a phone', () => {
        expect(isPhoneNumber('12345')).toBe(false);
    });

    test('phone with spaces is valid', () => {
        expect(isPhoneNumber('0987 654 321')).toBe(true);
    });

    test('empty string is not a phone', () => {
        expect(isPhoneNumber('')).toBe(false);
        expect(isPhoneNumber(null)).toBe(false);
    });
});

describe('Stock deduction calculation (FEFO logic)', () => {
    function getStockQuantityToDeduct(item) {
        return Number(item.quantity || 0) * Number(item.conversionRate || 1);
    }

    test('base unit (rate=1) deducts exact quantity', () => {
        expect(getStockQuantityToDeduct({ quantity: 5, conversionRate: 1 })).toBe(5);
    });

    test('large unit (hộp=10 viên) deducts correctly', () => {
        expect(getStockQuantityToDeduct({ quantity: 2, conversionRate: 10 })).toBe(20);
    });

    test('missing conversionRate defaults to 1', () => {
        expect(getStockQuantityToDeduct({ quantity: 3 })).toBe(3);
    });
});

describe('Offline order storage key naming', () => {
    const OFFLINE_ORDERS_KEY = 'pos_offline_orders';

    test('offline key name is as expected', () => {
        expect(OFFLINE_ORDERS_KEY).toBe('pos_offline_orders');
    });
});

describe('Variant description JSON parsing', () => {
    function parseVariantsFromDescription(description) {
        if (!description) return null;
        try {
            const desc = JSON.parse(description);
            if (desc && desc.variants && Object.keys(desc.variants).length > 0) {
                return desc.variants;
            }
        } catch (e) {}
        return null;
    }

    test('parses valid variant JSON', () => {
        const desc = JSON.stringify({ variants: { Màu: ['Đỏ', 'Xanh'], Size: ['S', 'M'] } });
        const result = parseVariantsFromDescription(desc);
        expect(result).not.toBeNull();
        expect(result.Màu).toContain('Đỏ');
    });

    test('returns null for empty description', () => {
        expect(parseVariantsFromDescription(null)).toBeNull();
        expect(parseVariantsFromDescription('')).toBeNull();
    });

    test('returns null for non-variant JSON', () => {
        const desc = JSON.stringify({ isCombo: true, items: [] });
        expect(parseVariantsFromDescription(desc)).toBeNull();
    });

    test('returns null for invalid JSON', () => {
        expect(parseVariantsFromDescription('not-json')).toBeNull();
    });
});

describe('Combo description JSON parsing', () => {
    function parseComboFromDescription(description) {
        if (!description) return null;
        try {
            const desc = JSON.parse(description);
            if (desc && desc.isCombo && desc.items) return desc;
        } catch (e) {}
        return null;
    }

    test('parses valid combo JSON', () => {
        const desc = JSON.stringify({ isCombo: true, items: [{ id: '1', name: 'Panadol', quantity: 2, unit: 'Viên' }] });
        const result = parseComboFromDescription(desc);
        expect(result).not.toBeNull();
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('Panadol');
    });

    test('returns null for variant JSON', () => {
        const desc = JSON.stringify({ variants: { Màu: ['Đỏ'] } });
        expect(parseComboFromDescription(desc)).toBeNull();
    });

    test('returns null for invalid JSON', () => {
        expect(parseComboFromDescription('broken')).toBeNull();
    });
});

describe('AI price command parsing', () => {
    function parsePriceFromCommand(cmdNoTones) {
        const priceMatch = cmdNoTones.match(/(\d+[K]?)/);
        if (!priceMatch) return null;
        const rawPrice = priceMatch[1];
        return rawPrice.toUpperCase().includes('K')
            ? parseInt(rawPrice) * 1000
            : parseInt(rawPrice);
    }

    test('parses "20k" as 20000', () => {
        expect(parsePriceFromCommand('SUA PANADOL GIA 20K')).toBe(20000);
    });

    test('parses raw number correctly', () => {
        expect(parsePriceFromCommand('SUA PANADOL GIA 25000')).toBe(25000);
    });

    test('returns null when no number', () => {
        expect(parsePriceFromCommand('SUA PANADOL')).toBeNull();
    });
});
