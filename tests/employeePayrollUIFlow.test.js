const { execFileSync } = require('child_process');

test('payroll DOM uses revised math after attendance edits and keeps employee privacy', () => {
    execFileSync('node', ['--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import fs from 'node:fs';
        import vm from 'node:vm';
        import { JSDOM } from 'jsdom';
        import * as payrollRules from './js/features/employees/employeePayrollRules.js';
        import * as visibility from './js/features/employees/employeePayrollVisibilityRules.js';
        import { resolvePayrollEmployeeForPeriod } from './js/features/employees/employeePayrollPeriodSettingsRules.js';
        import { formatPayrollMonthLabel } from './js/features/employees/employeePayrollPeriodRules.js';
        import { escapeEmployeeHtml } from './js/features/employees/employeePresentationRules.js';

        const dom = new JSDOM(fs.readFileSync('pages/employees.html', 'utf8'));
        const $ = id => dom.window.document.getElementById(id);
        const source = fs.readFileSync('js/features/employees/employeesController.js', 'utf8');
        let viewer = { id: 'admin', role: 'admin' };
        const context = {
            ...payrollRules, ...visibility, resolvePayrollEmployeeForPeriod,
            formatPayrollMonthLabel, escapeHtml: escapeEmployeeHtml,
            $, money: new Intl.NumberFormat('vi-VN'), getCurrentUser: () => viewer,
            employees: [
                { id: 'hung', name: 'Hùng', monthly_salary: 9_000_000 },
                { id: 'long', name: 'Long', monthly_salary: 6_300_000 }
            ],
            payrollPeriodSettings: new Map([['hung', {
                monthly_salary: 7_500_000, monthly_allowance: 250_000, commission_rate: 1
            }]]),
            payrollMonth: new Date(2026, 6, 1), payrollShifts: []
        };
        const rendering = source.slice(source.indexOf('function renderPayroll()'), source.indexOf('function resetEmployeeForm()'));
        vm.createContext(context);
        vm.runInContext(rendering, context);
        for (let off = 0; off <= 8; off++) {
            context.payrollShifts = Array.from({ length: 31 }, (_, i) => ({
                employee_id: 'hung', shift_date: '2026-07-' + String(i+1).padStart(2,'0'),
                status: i < off ? 'off' : 'worked', sales_amount: i === 30 ? 1_000_000 : 0
            }));
            vm.runInContext('renderPayroll()', context);
            const rows = $('payrollTableBody').querySelectorAll('tr');
            assert.equal(rows.length, 2);
            const cells = rows[0].querySelectorAll('td');
            const base = 7_500_000 + (4 - off) * 250_000;
            assert.equal(cells[4].firstElementChild.textContent, context.money.format(base));
            assert.equal(cells[7].textContent, context.money.format(base + 250_000 + 10_000));
            assert.ok(cells[4].textContent.includes('250.000đ/ngày (chia 30)'));
            assert.equal(cells[1].firstElementChild.textContent, String(31 - off));
            assert.ok(cells[1].textContent.includes('Ngày làm ghi nhận'));
            assert.ok(!$('payrollTableBody').textContent.includes('ngày lương quy đổi'));
            assert.ok(cells[2].textContent.includes(Math.min(off, 3) + ' nghỉ thường + ' + Math.min(1, Math.max(0, off - 3)) + ' nghỉ phép hưởng lương'));
            assert.ok(cells[2].textContent.includes(Math.max(0, off - 4) + ' ngày nghỉ không lương'));
            if (off < 4) assert.ok(cells[4].textContent.includes('Cộng ' + (4-off) + ' ngày lương'));
            if (off === 4) assert.ok(cells[4].textContent.includes('Giữ nguyên lương cơ bản'));
            if (off > 4) assert.ok(cells[4].textContent.includes('Trừ ' + (off-4) + ' ngày lương'));
            assert.equal(rows[1].querySelectorAll('td')[7].textContent, '0');
            assert.ok(rows[1].querySelectorAll('td')[4].textContent.includes('Chưa có ngày công/nghỉ'));
        }
        viewer = { id: 'hung', name: 'Hùng', role: 'staff' };
        vm.runInContext('renderPayroll()', context);
        assert.equal($('payrollTableBody').querySelectorAll('tr').length, 1);
        assert.ok(!$('payrollTableBody').textContent.includes('Long'));
        assert.equal($('payrollTableBody').querySelectorAll('button').length, 0);
        assert.equal($('payrollPeriodLabel').textContent, 'Tháng 7 / 2026');

        $('monthlySalary').value = '7500000';
        $('monthlyAllowance').value = '250000';
        vm.runInContext('renderEmployeeCompensationPreview()', context);
        assert.equal($('employeeDailyRatePreview').textContent, '250.000');
        assert.equal($('employeePaidLeavePreview').textContent, '7.750.000');
        assert.equal($('employeeUnusedLeavePreview').textContent, '8.000.000');
        assert.ok(dom.window.document.body.textContent.includes('Tạm tính cả tháng theo ngày nghỉ đã nhập'));
        dom.window.close();
    `], { cwd: process.cwd(), stdio: 'pipe' });
});
