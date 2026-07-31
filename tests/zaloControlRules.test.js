const { execFileSync } = require('child_process');

describe('Zalo control rules', () => {
    test('enforces verified admin access, safe commands, status and cron labels', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import {
                ZALO_COMMANDS,
                formatCronLabel,
                isZaloAdmin,
                resolveBotConnection
            } from './js/features/zalo/zaloControlRules.js';

            assert.equal(isZaloAdmin({ role: 'admin', authenticatedSession: true }), true);
            assert.equal(isZaloAdmin({ role: 'manager', authenticatedSession: true }), false);
            assert.equal(isZaloAdmin({ role: 'admin' }), false);
            assert.deepEqual(Object.keys(ZALO_COMMANDS), [
                'send_admin_agenda',
                'run_inventory_audit',
                'send_out_of_stock_report',
                'send_low_stock_report',
                'send_missing_cost_report',
                'send_expiring_report',
                'check_connection'
            ]);
            assert.doesNotMatch(JSON.stringify(ZALO_COMMANDS), /powershell|shell|exec/i);

            const now = new Date('2026-07-31T10:00:00Z');
            assert.equal(resolveBotConnection({
                last_heartbeat_at: '2026-07-31T09:58:00Z',
                status: 'online',
                zalo_connected: true
            }, now).state, 'online');
            assert.equal(resolveBotConnection({
                last_heartbeat_at: '2026-07-31T09:50:00Z',
                status: 'online',
                zalo_connected: true
            }, now).state, 'offline');
            assert.equal(formatCronLabel('0 17 * * *'), '17:00');
            assert.equal(formatCronLabel('invalid'), '--:--');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
