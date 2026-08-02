const { execFileSync } = require('child_process');

describe('Zalo inventory audit rules', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('prefers the dedicated Zalo group and removes duplicate fallback targets', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { resolveInventoryAuditTargets } from './bot-assistant/rules/inventoryAuditRules.js';

            assert.deepEqual(
                resolveInventoryAuditTargets({
                    audit_group_name: 'Nhóm Kiểm Kê',
                    staff_list: ['Nhân viên A']
                }, {}),
                ['Nhóm Kiểm Kê']
            );
            assert.deepEqual(
                resolveInventoryAuditTargets({
                    staff_list: ['Nhân viên A', ' Nhân viên A ', 'Nhân viên B']
                }, {}),
                ['Nhân viên A', 'Nhân viên B']
            );
        `);
    });

    test('chunks the complete daily list without exposing system stock', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildInventoryAuditMessages } from './bot-assistant/rules/inventoryAuditRules.js';

            const tasks = Array.from({ length: 52 }, (_, index) => ({
                product_name: 'Sản phẩm ' + (index + 1),
                product_code: 'SP' + (index + 1),
                base_unit: 'Hộp',
                tag_group: index % 2 ? 'retail' : 'dose_cut',
                total_stock: 999
            }));
            const messages = buildInventoryAuditMessages(tasks, {
                chunkSize: 25,
                dateLabel: '23/07/2026'
            });

            assert.equal(messages.length, 3);
            assert.match(messages[0], /1\\. Sản phẩm 1/);
            assert.match(messages[2], /52\\. Sản phẩm 52/);
            assert.equal(messages.join('\\n').includes('999'), false);
            assert.equal(messages.join('\\n').includes('Tồn:'), false);
        `);
    });

    test('reports unit, batch, and stocktake changes after two hours', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildInventoryAuditFollowup } from './bot-assistant/rules/inventoryAuditRules.js';

            const snapshot = {
                tasks: [{
                    product_id: 'p1',
                    product_name: 'Thuốc A',
                    product_code: 'SPA',
                    units: [
                        { id: 'u1', unit_name: 'Viên', conversion_rate: 1, is_base_unit: true },
                        { id: 'u2', unit_name: 'Vỉ', conversion_rate: 10, is_base_unit: false }
                    ],
                    batches: [
                        { id: 'b1', batch_number: 'LO1', stock_quantity: 10 }
                    ]
                }]
            };
            const current = new Map([['p1', {
                units: [
                    { id: 'u1', unit_name: 'Viên', conversion_rate: 1, is_base_unit: true },
                    { id: 'u2', unit_name: 'Vỉ', conversion_rate: 12, is_base_unit: false }
                ],
                batches: []
            }]]);
            const report = buildInventoryAuditFollowup(snapshot, current, [{
                product_id: 'p1',
                movement_type: 'stocktake_adjustment'
            }], { timeLabel: '14:00 23/07/2026' });

            assert.equal(report.completedCount, 1);
            assert.equal(report.missingCount, 0);
            assert.equal(report.changedCount, 1);
            assert.match(report.message, /Vỉ: 10 → 12/);
            assert.match(report.message, /lô LO1: đã hết\\/đã loại/);
        `);
    });
});
