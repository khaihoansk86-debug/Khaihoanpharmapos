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

describe('Combo search and cost helper logic', () => {
    function parseComboDescription(description) {
        if (!description) return null;
        try {
            const parsed = typeof description === 'string' ? JSON.parse(description) : description;
            if (!parsed || parsed.isCombo !== true || !Array.isArray(parsed.items)) return null;
            return parsed;
        } catch (error) {
            return null;
        }
    }

    function getProductCategoryName(product) {
        return String(product?.product_categories?.name || product?.categories?.name || '').trim();
    }

    function isDoseLikeProduct(product) {
        const description = product?.description;
        try {
            const flags = typeof description === 'string' ? JSON.parse(description) : description;
            return flags?.is_dose_cut === true || flags?.is_dose_retail === true;
        } catch (error) {
            return false;
        }
    }

    function isComboCatalogProduct(product) {
        const categoryName = getProductCategoryName(product).toLowerCase();
        const code = String(product?.product_code || '').toUpperCase();
        return categoryName.includes('combo') || code.startsWith('CB');
    }

    function filterComboSearchProducts(products = [], rawQuery = '') {
        const query = String(rawQuery || '').trim().toLowerCase();
        if (!query) return [];

        return (products || []).filter(product => {
            if (!product || product.is_active === false) return false;
            if (isDoseLikeProduct(product)) return false;
            if (isComboCatalogProduct(product)) return false;
            const name = String(product?.name || '').toLowerCase();
            const code = String(product?.product_code || '').toLowerCase();
            return name.includes(query) || code.includes(query);
        });
    }

    function expandComboItems(comboDefinition, parentQuantity = 1) {
        if (!comboDefinition?.items?.length) return [];
        return comboDefinition.items.map(item => ({
            id: item.id,
            name: item.name,
            unit: item.unit,
            quantity: Number(item.quantity || 0) * Number(parentQuantity || 1)
        }));
    }

    function buildComboDefinitionMap(products = []) {
        const map = new Map();
        products.forEach(product => {
            const definition = parseComboDescription(product.description);
            if (definition && product.id) map.set(product.id, definition);
        });
        return map;
    }

    function estimateComboCost({ item, comboDefinitionMap, unitCosts, sign = 1, visited = new Set() }) {
        const productId = item?.product_id;
        if (!productId) return null;
        if (visited.has(productId)) return { cost: 0, source: 'missing' };
        const comboDefinition = comboDefinitionMap.get(productId);
        if (!comboDefinition) return null;

        const nextVisited = new Set(visited);
        nextVisited.add(productId);

        let totalCost = 0;
        let hasMissingCost = false;
        expandComboItems(comboDefinition, Math.abs(Number(item.quantity || 0))).forEach(component => {
            const nested = estimateComboCost({
                item: { product_id: component.id, quantity: component.quantity },
                comboDefinitionMap,
                unitCosts,
                sign: 1,
                visited: nextVisited
            });
            if (nested) {
                totalCost += nested.cost;
                hasMissingCost = hasMissingCost || nested.source === 'missing';
                return;
            }

            const directUnit = unitCosts.get(`${component.id}::${component.unit || ''}`) || unitCosts.get(`${component.id}::__base__`);
            const unitCost = Number(directUnit?.cost_price || 0);
            if (unitCost > 0) {
                totalCost += unitCost * Number(component.quantity || 0);
            } else {
                hasMissingCost = true;
            }
        });

        return { cost: sign * totalCost, source: hasMissingCost ? 'missing' : 'combo' };
    }

    test('filters combo search results to normal products only', () => {
        const products = [
            { id: '1', name: 'Panadol Extra', product_code: 'PA001', product_categories: { name: 'Thuốc giảm đau' }, is_active: true },
            { id: '2', name: 'Combo Cảm', product_code: 'CB001', product_categories: { name: 'Combo - Cảm cúm' }, is_active: true },
            { id: '3', name: 'Thuốc liều 12k', product_code: 'DOSE-12', product_categories: { name: 'Thuốc liều' }, is_active: true }
        ];

        const result = filterComboSearchProducts(products, 'pa');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    test('expands combo items by combo quantity', () => {
        const combo = parseComboDescription(JSON.stringify({
            isCombo: true,
            items: [{ id: 'p1', name: 'Panadol', quantity: 2, unit: 'Viên' }]
        }));

        expect(expandComboItems(combo, 3)).toEqual([
            { id: 'p1', name: 'Panadol', unit: 'Viên', quantity: 6 }
        ]);
    });

    test('estimates combo cost from child component costs', () => {
        const comboProducts = [{
            id: 'combo-1',
            description: JSON.stringify({
                isCombo: true,
                items: [
                    { id: 'drug-1', name: 'A', quantity: 2, unit: 'Viên' },
                    { id: 'drug-2', name: 'B', quantity: 1, unit: 'Viên' }
                ]
            })
        }];
        const comboDefinitionMap = buildComboDefinitionMap(comboProducts);
        const unitCosts = new Map([
            ['drug-1::Viên', { cost_price: 1000 }],
            ['drug-2::Viên', { cost_price: 5000 }]
        ]);

        const costMeta = estimateComboCost({
            item: { product_id: 'combo-1', quantity: 3 },
            comboDefinitionMap,
            unitCosts
        });

        expect(costMeta).toEqual({ cost: 21000, source: 'combo' });
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

describe('Employee shift order matching logic', () => {
    function getLocalTimeSeconds(dateStr) {
        const d = new Date(dateStr);
        return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    }

    function normalizeTimeToSeconds(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        const hrs = parts[0] || 0;
        const mins = parts[1] || 0;
        const secs = parts[2] || 0;
        return hrs * 3600 + mins * 60 + secs;
    }

    function isTimeInInterval(timeSec, startSec, endSec) {
        if (endSec >= startSec) {
            return timeSec >= startSec && timeSec < endSec;
        } else {
            return timeSec >= startSec || timeSec < endSec;
        }
    }

    test('normalizeTimeToSeconds parses HH:MM and HH:MM:SS correctly', () => {
        expect(normalizeTimeToSeconds('07:00')).toBe(7 * 3600);
        expect(normalizeTimeToSeconds('14:30:15')).toBe(14 * 3600 + 30 * 60 + 15);
        expect(normalizeTimeToSeconds('')).toBe(0);
        expect(normalizeTimeToSeconds(null)).toBe(0);
    });

    test('isTimeInInterval handles normal intervals correctly', () => {
        const start = normalizeTimeToSeconds('07:00');
        const end = normalizeTimeToSeconds('14:00');
        expect(isTimeInInterval(normalizeTimeToSeconds('08:30'), start, end)).toBe(true);
        expect(isTimeInInterval(normalizeTimeToSeconds('06:59'), start, end)).toBe(false);
        expect(isTimeInInterval(normalizeTimeToSeconds('14:00'), start, end)).toBe(false);
    });

    test('isTimeInInterval handles overnight/midnight-spanning shifts', () => {
        // e.g. 22:00 to 06:00
        const start = normalizeTimeToSeconds('22:00');
        const end = normalizeTimeToSeconds('06:00');
        expect(isTimeInInterval(normalizeTimeToSeconds('23:30'), start, end)).toBe(true);
        expect(isTimeInInterval(normalizeTimeToSeconds('01:15'), start, end)).toBe(true);
        expect(isTimeInInterval(normalizeTimeToSeconds('21:59'), start, end)).toBe(false);
        expect(isTimeInInterval(normalizeTimeToSeconds('06:00'), start, end)).toBe(false);
    });
});

describe('Dose cut item mapping logic', () => {
    function mapOrderItems(payableItems, orderData) {
        const isInternal = orderData.isInternal === true;
        const filteredItems = payableItems;

        return filteredItems.map(item => {
            const isIng = orderData.isDoseCut && item.isIngredient;
            const price = isIng ? 0 : item.price;
            return {
                unit_price:   isInternal ? -Math.abs(price) : price,
                quantity:     Math.abs(item.quantity),
                total_price:  isInternal ? -Math.abs(price * item.quantity) : (price * item.quantity)
            };
        });
    }

    test('retains ingredient items in dose cut but sets price and revenue to 0', () => {
        const payableItems = [
            { id: '1', name: 'Main Dose 12k', price: 12000, quantity: 1, isIngredient: false },
            { id: '2', name: 'Ingredient A', price: 5000, quantity: 2, isIngredient: true }
        ];
        const orderData = { isDoseCut: true };
        const mapped = mapOrderItems(payableItems, orderData);

        expect(mapped).toHaveLength(2);
        // Main dose
        expect(mapped[0].unit_price).toBe(12000);
        expect(mapped[0].total_price).toBe(12000);
        // Ingredient
        expect(mapped[1].unit_price).toBe(0);
        expect(mapped[1].total_price).toBe(0);
        expect(mapped[1].quantity).toBe(2);
    });
});

describe('Redirect and Keyboard Event Logic', () => {
    let mockLocation;
    let mockElements;
    let registeredListeners;

    beforeAll(() => {
        mockLocation = { href: '' };
        mockElements = {};
        registeredListeners = {};

        global.window = {
            location: mockLocation,
            POS_COMPLETED_EDIT_OR_RETURN: false,
            closeSuccessModal: () => {},
            processPayment: () => {}
        };

        global.document = {
            body: {
                innerHTML: ''
            },
            getElementById: (id) => {
                if (!mockElements[id]) {
                    mockElements[id] = {
                        classList: {
                            classes: new Set(),
                            contains(cls) { return this.classes.has(cls); },
                            add(cls) { this.classes.add(cls); },
                            remove(cls) { this.classes.delete(cls); }
                        }
                    };
                }
                return mockElements[id];
            },
            addEventListener: (event, cb) => {
                registeredListeners[event] = cb;
            },
            removeEventListener: (event, cb) => {
                delete registeredListeners[event];
            }
        };
    });

    afterAll(() => {
        delete global.window;
        delete global.document;
    });

    beforeEach(() => {
        mockLocation.href = '';
        mockElements = {};
        registeredListeners = {};
        global.window.POS_COMPLETED_EDIT_OR_RETURN = false;
    });

    test('closeSuccessModal redirects to invoices.html when POS_COMPLETED_EDIT_OR_RETURN is true', () => {
        let modalClosed = false;
        const closeSuccessModal = () => {
            modalClosed = true;
            document.getElementById('paymentSuccessModal').classList.add('hidden');
        };
        
        global.window.closeSuccessModal = () => {
            closeSuccessModal();
            if (global.window.POS_COMPLETED_EDIT_OR_RETURN) {
                global.window.location.href = 'invoices.html';
            }
        };

        global.window.POS_COMPLETED_EDIT_OR_RETURN = true;
        global.window.closeSuccessModal();
        
        expect(modalClosed).toBe(true);
        expect(mockLocation.href).toBe('invoices.html');
    });

    test('closeSuccessModal does not redirect when POS_COMPLETED_EDIT_OR_RETURN is false', () => {
        let modalClosed = false;
        const closeSuccessModal = () => {
            modalClosed = true;
            document.getElementById('paymentSuccessModal').classList.add('hidden');
        };
        
        global.window.closeSuccessModal = () => {
            closeSuccessModal();
            if (global.window.POS_COMPLETED_EDIT_OR_RETURN) {
                global.window.location.href = 'invoices.html';
            }
        };

        global.window.POS_COMPLETED_EDIT_OR_RETURN = false;
        global.window.closeSuccessModal();
        
        expect(modalClosed).toBe(true);
        expect(mockLocation.href).toBe('');
    });

    test('keydown F10 event close modal when modal is visible', () => {
        let processPaymentCalled = false;
        let closeSuccessModalCalled = false;
        
        global.window.processPayment = () => {
            processPaymentCalled = true;
        };
        
        global.window.closeSuccessModal = () => {
            closeSuccessModalCalled = true;
        };

        // Keydown listener setup
        const keydownListener = (event) => {
            const tag = event.target?.tagName;
            const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable;
            if (event.key === 'F10') {
                if (event.preventDefault) event.preventDefault();
                const successModal = document.getElementById('paymentSuccessModal');
                if (successModal && !successModal.classList.contains('hidden')) {
                    global.window.closeSuccessModal();
                } else {
                    global.window.processPayment();
                }
                return;
            }
        };
        document.addEventListener('keydown', keydownListener);

        // Scenario 1: Modal is hidden -> runs processPayment
        const successModal = document.getElementById('paymentSuccessModal');
        successModal.classList.add('hidden');
        
        let mockEvent = { key: 'F10', preventDefault: jest.fn() };
        registeredListeners['keydown'](mockEvent);
        
        expect(processPaymentCalled).toBe(true);
        expect(closeSuccessModalCalled).toBe(false);

        // Reset tracking variables
        processPaymentCalled = false;
        closeSuccessModalCalled = false;

        // Scenario 2: Modal is visible -> runs closeSuccessModal
        successModal.classList.remove('hidden');
        
        mockEvent = { key: 'F10', preventDefault: jest.fn() };
        registeredListeners['keydown'](mockEvent);
        
        expect(processPaymentCalled).toBe(false);
        expect(closeSuccessModalCalled).toBe(true);
        
        // Cleanup listener
        document.removeEventListener('keydown', keydownListener);
    });

    test('keydown Escape event close modal when modal is visible', () => {
        let closeSuccessModalCalled = false;
        
        global.window.closeSuccessModal = () => {
            closeSuccessModalCalled = true;
        };

        const keydownListener = (event) => {
            const tag = event.target?.tagName;
            const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable;
            if (event.key === 'Escape' || event.key === 'Esc') {
                const successModal = document.getElementById('paymentSuccessModal');
                if (successModal && !successModal.classList.contains('hidden')) {
                    if (event.preventDefault) event.preventDefault();
                    global.window.closeSuccessModal();
                    return;
                }
            }
        };
        document.addEventListener('keydown', keydownListener);

        // Scenario 1: Modal is hidden -> Escape key does NOT call closeSuccessModal
        const successModal = document.getElementById('paymentSuccessModal');
        successModal.classList.add('hidden');
        
        let mockEvent = { key: 'Escape', preventDefault: jest.fn() };
        registeredListeners['keydown'](mockEvent);
        
        expect(closeSuccessModalCalled).toBe(false);

        // Scenario 2: Modal is visible -> Escape key calls closeSuccessModal
        successModal.classList.remove('hidden');
        
        mockEvent = { key: 'Escape', preventDefault: jest.fn() };
        registeredListeners['keydown'](mockEvent);
        
        expect(closeSuccessModalCalled).toBe(true);
        
        // Cleanup listener
        document.removeEventListener('keydown', keydownListener);
    });
});

describe('Diacritic-insensitive search matching for Receive Module', () => {
    function removeVietnameseTones(str) {
        if (!str) return '';
        return String(str).normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    function searchMatches(query, product) {
        const normalizedQuery = removeVietnameseTones(query).trim().toLowerCase();
        const nameNorm = removeVietnameseTones(product.name || '').toLowerCase();
        const codeNorm = removeVietnameseTones(product.product_code || '').toLowerCase();
        return nameNorm.includes(normalizedQuery) || codeNorm.includes(normalizedQuery);
    }

    test('matches unaccented query to accented product name', () => {
        const product = { name: 'Dầu Thảo Dược Cánh Sen', product_code: 'SP001' };
        expect(searchMatches('dau thao', product)).toBe(true);
        expect(searchMatches('dau tha', product)).toBe(true);
        expect(searchMatches('canh sen', product)).toBe(true);
    });

    test('matches accented query to accented product name', () => {
        const product = { name: 'Dầu Thảo Dược Cánh Sen', product_code: 'SP001' };
        expect(searchMatches('dầu thảo', product)).toBe(true);
    });

    test('matches query by product code', () => {
        const product = { name: 'Dầu Thảo Dược Cánh Sen', product_code: 'SP001' };
        expect(searchMatches('sp001', product)).toBe(true);
    });

    test('does not match unrelated queries', () => {
        const product = { name: 'Dầu Thảo Dược Cánh Sen', product_code: 'SP001' };
        expect(searchMatches('panadol', product)).toBe(false);
    });
});

describe('Bidirectional Paid and Debt calculation in Receive Module', () => {
    let mockPaidInput;
    let mockDebtInput;
    let receiveLines;
    let lastEditedField;

    const els = {
        get receivePaidInput() { return mockPaidInput; },
        get receiveDebtInput() { return mockDebtInput; },
        receiveTotalVal: { textContent: '' }
    };

    const formatCurrency = (amount) => amount.toString();

    function updateOverallTotal() {
        let total = receiveLines.reduce((sum, line) => sum + line.subtotal, 0);
        els.receiveTotalVal.textContent = formatCurrency(total);

        if (els.receivePaidInput && els.receiveDebtInput) {
            if (!lastEditedField) {
                els.receivePaidInput.value = total;
                els.receiveDebtInput.value = 0;
            } else if (lastEditedField === 'paid') {
                let paid = Number(els.receivePaidInput.value || 0);
                if (paid > total) {
                    paid = total;
                    els.receivePaidInput.value = total;
                }
                els.receiveDebtInput.value = Math.max(0, total - paid);
            } else if (lastEditedField === 'debt') {
                let debt = Number(els.receiveDebtInput.value || 0);
                if (debt > total) {
                    debt = total;
                    els.receiveDebtInput.value = total;
                }
                els.receivePaidInput.value = Math.max(0, total - debt);
            }
        }
    }

    beforeEach(() => {
        mockPaidInput = { value: '0' };
        mockDebtInput = { value: '0' };
        receiveLines = [
            { subtotal: 15000 },
            { subtotal: 20000 }
        ]; // total = 35000
        lastEditedField = null;
    });

    test('default state (no manual edit) sets paid = total and debt = 0', () => {
        updateOverallTotal();
        expect(mockPaidInput.value).toBe(35000);
        expect(mockDebtInput.value).toBe(0);
    });

    test('manual edit on paid updates debt and locks state', () => {
        lastEditedField = 'paid';
        mockPaidInput.value = 25000;
        updateOverallTotal();
        expect(mockDebtInput.value).toBe(10000);

        // Add more items -> paid stays 25000, debt increases
        receiveLines.push({ subtotal: 10000 }); // total = 45000
        updateOverallTotal();
        expect(mockPaidInput.value).toBe(25000);
        expect(mockDebtInput.value).toBe(20000);
    });

    test('manual edit on debt updates paid and locks state', () => {
        lastEditedField = 'debt';
        mockDebtInput.value = 5000;
        updateOverallTotal();
        expect(mockPaidInput.value).toBe(30000);

        // Add more items -> debt stays 5000, paid increases
        receiveLines.push({ subtotal: 15000 }); // total = 50000
        updateOverallTotal();
        expect(mockDebtInput.value).toBe(5000);
        expect(mockPaidInput.value).toBe(45000);
    });

    test('capping occurs when paid exceeds total', () => {
        lastEditedField = 'paid';
        mockPaidInput.value = 40000; // exceeds total 35000
        updateOverallTotal();
        expect(mockPaidInput.value).toBe(35000);
        expect(mockDebtInput.value).toBe(0);
    });

    test('capping occurs when debt exceeds total', () => {
        lastEditedField = 'debt';
        mockDebtInput.value = 50000; // exceeds total 35000
        updateOverallTotal();
        expect(mockDebtInput.value).toBe(35000);
        expect(mockPaidInput.value).toBe(0);
    });
});

describe('Overview Dashboard Employee Mode Logic', () => {
    function getSummaryCards(summary, comparison, currentOrderType, isEmpMode) {
        let cards = [];
        if (isEmpMode) {
            if (currentOrderType === 'all') {
                const retailItemsSold = (summary.itemsSold || 0) - (summary.ecommerceItemsSold || 0);
                cards = [
                    ['Doanh thu POS Bán lẻ', summary.retailRevenue],
                    ['Số hóa đơn Bán lẻ', summary.retailInvoices],
                    ['Lượng bán POS Bán lẻ', retailItemsSold],
                    ['Lượng bán POS TMĐT', summary.ecommerceItemsSold]
                ];
            } else {
                cards = [
                    ['Doanh thu', summary.revenue],
                    ['Số hóa đơn', summary.invoices],
                    ['Lượng bán', summary.itemsSold],
                    ['Giá trị đơn TB', summary.averageOrder]
                ];
            }
        } else {
            if (currentOrderType === 'all') {
                cards = [
                    ['Doanh thu POS Bán lẻ', summary.retailRevenue],
                    ['Lợi nhuận POS Bán lẻ', summary.retailProfit],
                    ['Giá vốn POS TMĐT', summary.ecommerceCost],
                    ['Lượng bán POS TMĐT', summary.ecommerceItemsSold]
                ];
            } else {
                cards = [
                    ['Doanh thu', summary.revenue],
                    ['Lợi nhuận gộp', summary.grossProfit],
                    ['Số hóa đơn', summary.invoices],
                    ['Giá trị đơn TB', summary.averageOrder]
                ];
            }
        }
        return cards;
    }

    test('Admin mode shows profit and cost parameters', () => {
        const summary = {
            retailRevenue: 1000000,
            retailProfit: 300000,
            ecommerceCost: 200000,
            ecommerceItemsSold: 10
        };
        const cards = getSummaryCards(summary, {}, 'all', false);
        expect(cards[1][0]).toBe('Lợi nhuận POS Bán lẻ');
        expect(cards[1][1]).toBe(300000);
        expect(cards[2][0]).toBe('Giá vốn POS TMĐT');
    });

    test('Employee mode replaces profit and cost parameters with invoices and items count', () => {
        const summary = {
            retailRevenue: 1000000,
            retailInvoices: 12,
            itemsSold: 25,
            ecommerceItemsSold: 10,
            ecommerceRevenue: 500000
        };
        const cards = getSummaryCards(summary, {}, 'all', true);
        expect(cards[1][0]).toBe('Số hóa đơn Bán lẻ');
        expect(cards[1][1]).toBe(12);
        expect(cards[2][0]).toBe('Lượng bán POS Bán lẻ');
        expect(cards[2][1]).toBe(15); // itemsSold (25) - ecommerceItemsSold (10)
    });
});


