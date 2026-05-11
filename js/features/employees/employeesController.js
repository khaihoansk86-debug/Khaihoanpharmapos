import { initLayout } from '../../components/layout.js';
import { deleteShift, getEmployees, getShifts, saveEmployee, saveShift } from './employeeService.js';

const money = new Intl.NumberFormat('vi-VN');
let employees = [];
let shifts = [];

const $ = (id) => document.getElementById(id);

function today() {
    return new Date().toISOString().slice(0, 10);
}

function monthRange() {
    const date = new Date();
    const first = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { first, last };
}

function employeeName(id) {
    return employees.find(item => item.id === id)?.name || 'Không rõ';
}

function renderSummary() {
    const workedDays = shifts.filter(item => item.status === 'worked').length;
    const offDays = shifts.filter(item => item.status === 'off').length;
    const sales = shifts.reduce((sum, item) => sum + Number(item.sales_amount || 0), 0);
    const activeEmployees = employees.filter(item => item.status === 'active').length;

    const cards = [
        ['fa-users', 'Nhân viên đang làm', activeEmployees, 'text-blue-600'],
        ['fa-calendar-check', 'Ca đã làm', workedDays, 'text-emerald-600'],
        ['fa-calendar-xmark', 'Ngày nghỉ', offDays, 'text-amber-600'],
        ['fa-chart-line', 'Doanh số theo ca', money.format(sales), 'text-violet-600']
    ];

    $('summaryCards').innerHTML = cards.map(([icon, label, value, color]) => `
        <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div class="flex items-center justify-between gap-4">
                <div>
                    <p class="text-xs font-black uppercase text-slate-400">${label}</p>
                    <p class="text-2xl font-black mt-2 text-slate-800 dark:text-white">${value}</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${color}">
                    <i class="fa-solid ${icon} text-xl"></i>
                </div>
            </div>
        </div>
    `).join('');
}

function renderEmployeeOptions() {
    const active = employees.filter(item => item.status === 'active');
    $('shiftEmployee').innerHTML = active.length
        ? active.map(item => `<option value="${item.id}">${item.name}</option>`).join('')
        : '<option value="">Chưa có nhân viên</option>';
}

function renderEmployees() {
    $('employeeList').innerHTML = employees.length ? employees.map(item => `
        <button type="button" class="edit-employee w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-400 transition-colors" data-id="${item.id}">
            <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <p class="font-bold text-sm text-slate-800 dark:text-white truncate">${item.name}</p>
                    <p class="text-xs text-slate-500 mt-1">${item.phone || 'Chưa có SĐT'}</p>
                </div>
                <span class="text-[11px] font-black px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}">
                    ${item.status === 'active' ? 'Đang làm' : 'Nghỉ việc'}
                </span>
            </div>
        </button>
    `).join('') : '<p class="text-sm text-slate-400 font-bold">Chưa có nhân viên.</p>';
}

function renderShifts() {
    $('shiftTableBody').innerHTML = shifts.length ? shifts.map(item => {
        const isOff = item.status === 'off';
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="px-5 py-4 font-bold">${item.shift_date}</td>
                <td class="px-5 py-4">${employeeName(item.employee_id)}</td>
                <td class="px-5 py-4">${item.shift_name}</td>
                <td class="px-5 py-4">${item.start_time || '--'} - ${item.end_time || '--'}</td>
                <td class="px-5 py-4 text-right font-bold">${money.format(Number(item.sales_amount || 0))}</td>
                <td class="px-5 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-black ${isOff ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}">
                        ${isOff ? 'Nghỉ' : 'Có làm'}
                    </span>
                </td>
                <td class="px-5 py-4 text-right">
                    <button class="edit-shift w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600" data-id="${item.id}" title="Sửa ca">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="delete-shift w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-700" data-id="${item.id}" title="Xóa ca">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('') : `
        <tr>
            <td colspan="7" class="px-5 py-16 text-center text-slate-400">
                <i class="fa-solid fa-calendar-days text-4xl mb-3"></i>
                <p class="font-bold">Chưa có lịch ca trong khoảng đang xem.</p>
            </td>
        </tr>
    `;
}

function renderPayroll() {
    const rows = employees.map(employee => {
        const employeeShifts = shifts.filter(item => item.employee_id === employee.id);
        const worked = employeeShifts.filter(item => item.status === 'worked').length;
        const off = employeeShifts.filter(item => item.status === 'off').length;
        const sales = employeeShifts.reduce((sum, item) => sum + Number(item.sales_amount || 0), 0);
        const basePay = worked * Number(employee.daily_rate || 0);
        const deduction = off * Number(employee.daily_rate || 0);
        const commission = sales * Number(employee.commission_rate || 0) / 100;
        const total = basePay + commission - deduction;

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="px-5 py-4 font-bold">${employee.name}</td>
                <td class="px-5 py-4 text-right">${worked}</td>
                <td class="px-5 py-4 text-right">${off}</td>
                <td class="px-5 py-4 text-right">${money.format(sales)}</td>
                <td class="px-5 py-4 text-right">${money.format(basePay)}</td>
                <td class="px-5 py-4 text-right">${money.format(commission)}</td>
                <td class="px-5 py-4 text-right font-black text-blue-600">${money.format(total)}</td>
            </tr>
        `;
    });

    $('payrollTableBody').innerHTML = rows.length ? rows.join('') : `
        <tr><td colspan="7" class="px-5 py-16 text-center text-slate-400 font-bold">Chưa có nhân viên.</td></tr>
    `;
}

function resetEmployeeForm() {
    $('employeeForm').reset();
    $('employeeId').value = '';
    $('dailyRate').value = 0;
    $('commissionRate').value = 0;
    $('employeeStatus').value = 'active';
}

function resetShiftForm() {
    $('shiftForm').reset();
    $('shiftId').value = '';
    $('shiftDate').value = today();
    $('startTime').value = '07:00';
    $('endTime').value = '14:00';
    $('shiftSales').value = 0;
    renderEmployeeOptions();
}

async function loadData() {
    employees = await getEmployees();
    shifts = await getShifts({ from: $('filterFrom').value, to: $('filterTo').value });
    renderEmployeeOptions();
    renderEmployees();
    renderSummary();
    renderShifts();
    renderPayroll();
}

function bindEvents() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(item => item.setAttribute('aria-selected', 'false'));
            button.setAttribute('aria-selected', 'true');
            const view = button.dataset.view;
            $('scheduleView').classList.toggle('hidden', view !== 'schedule');
            $('payrollView').classList.toggle('hidden', view !== 'payroll');
        });
    });

    $('employeeForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await saveEmployee({
            id: $('employeeId').value || null,
            name: $('employeeName').value,
            phone: $('employeePhone').value,
            daily_rate: $('dailyRate').value,
            commission_rate: $('commissionRate').value,
            status: $('employeeStatus').value
        });
        resetEmployeeForm();
        await loadData();
    });

    $('employeeList').addEventListener('click', (event) => {
        const button = event.target.closest('.edit-employee');
        if (!button) return;

        const employee = employees.find(item => item.id === button.dataset.id);
        if (!employee) return;

        $('employeeId').value = employee.id;
        $('employeeName').value = employee.name;
        $('employeePhone').value = employee.phone || '';
        $('dailyRate').value = Number(employee.daily_rate || 0);
        $('commissionRate').value = Number(employee.commission_rate || 0);
        $('employeeStatus').value = employee.status || 'active';
    });

    $('shiftForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!$('shiftEmployee').value) {
            alert('Bạn cần thêm nhân viên trước khi xếp ca.');
            return;
        }
        await saveShift({
            id: $('shiftId').value || null,
            employee_id: $('shiftEmployee').value,
            shift_date: $('shiftDate').value,
            shift_name: $('shiftName').value,
            start_time: $('startTime').value,
            end_time: $('endTime').value,
            sales_amount: $('shiftStatus').value === 'off' ? 0 : $('shiftSales').value,
            status: $('shiftStatus').value,
            note: $('shiftNote').value
        });
        resetShiftForm();
        await loadData();
    });

    $('shiftTableBody').addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-shift');
        const deleteButton = event.target.closest('.delete-shift');

        if (editButton) {
            const shift = shifts.find(item => item.id === editButton.dataset.id);
            if (!shift) return;
            $('shiftId').value = shift.id;
            $('shiftEmployee').value = shift.employee_id;
            $('shiftDate').value = shift.shift_date;
            $('shiftName').value = shift.shift_name;
            $('startTime').value = shift.start_time || '';
            $('endTime').value = shift.end_time || '';
            $('shiftSales').value = Number(shift.sales_amount || 0);
            $('shiftStatus').value = shift.status;
            $('shiftNote').value = shift.note || '';
        }

        if (deleteButton && confirm('Xóa ca làm này?')) {
            await deleteShift(deleteButton.dataset.id);
            await loadData();
        }
    });

    $('filterFrom').addEventListener('change', loadData);
    $('filterTo').addEventListener('change', loadData);
    $('resetEmployeeForm').addEventListener('click', resetEmployeeForm);
    $('resetShiftForm').addEventListener('click', resetShiftForm);
    $('thisMonthBtn').addEventListener('click', async () => {
        const { first, last } = monthRange();
        $('filterFrom').value = first;
        $('filterTo').value = last;
        await loadData();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('admin', 'employees');
    const { first, last } = monthRange();
    $('filterFrom').value = first;
    $('filterTo').value = last;
    resetEmployeeForm();
    resetShiftForm();
    bindEvents();
    await loadData();
});
