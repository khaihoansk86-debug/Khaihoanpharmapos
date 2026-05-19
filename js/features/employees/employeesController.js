import { initLayout } from '../../components/layout.js';
import { deleteShift, getEmployees, getShifts, saveEmployee, saveShift } from './employeeService.js';

const money = new Intl.NumberFormat('vi-VN');
const SHIFT_TEMPLATES_KEY = 'khp_shift_templates';
const DEFAULT_SHIFT_TEMPLATES = [
    { id: 'morning', name: 'Sáng', start_time: '07:00', end_time: '14:00' },
    { id: 'afternoon', name: 'Chiều', start_time: '14:00', end_time: '21:00' },
    { id: 'full-day', name: 'Cả ngày', start_time: '07:00', end_time: '21:00' }
];

let employees = [];
let shifts = [];
let shiftTemplates = [];
let currentWeekStart = getMonday(new Date());

const $ = (id) => document.getElementById(id);

function today() {
    return formatDate(new Date());
}

function parseLocalDate(value) {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const [year, month, day] = String(value).split('-').map(Number);
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day);
}

function getMonday(d) {
    const date = parseLocalDate(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date;
}

function formatDate(date) {
    const localDate = parseLocalDate(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function monthRange() {
    const date = new Date();
    const first = formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
    const last = formatDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    return { first, last };
}

function createLocalId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function readShiftTemplates() {
    try {
        const saved = JSON.parse(localStorage.getItem(SHIFT_TEMPLATES_KEY) || '[]');
        return saved.length ? saved : DEFAULT_SHIFT_TEMPLATES;
    } catch {
        return DEFAULT_SHIFT_TEMPLATES;
    }
}

function saveShiftTemplates() {
    localStorage.setItem(SHIFT_TEMPLATES_KEY, JSON.stringify(shiftTemplates));
}

function employeeName(id) {
    return employees.find(item => item.id === id)?.name || 'Không rõ';
}

function ensureTemplatesFromShifts() {
    const existingKeys = new Set(shiftTemplates.map(item => templateKey(item)));
    shifts.forEach(shift => {
        const template = {
            id: createLocalId('shift-template'),
            name: shift.shift_name || 'Ca làm',
            start_time: shift.start_time || '',
            end_time: shift.end_time || ''
        };
        const key = templateKey(template);
        if (!existingKeys.has(key)) {
            existingKeys.add(key);
            shiftTemplates.push(template);
        }
    });
    saveShiftTemplates();
}

function templateKey(item) {
    return `${item.name || ''}|${item.start_time || ''}|${item.end_time || ''}`;
}

function formatTimeRange(item) {
    if (!item.start_time && !item.end_time) return 'Chưa set giờ';
    return `${item.start_time || '--:--'} - ${item.end_time || '--:--'}`;
}

function shiftMatchesTemplate(shift, template) {
    return (shift.shift_name || '') === template.name
        && (shift.start_time || '') === (template.start_time || '')
        && (shift.end_time || '') === (template.end_time || '');
}

function renderSummary() {
    const workedDays = shifts.filter(item => item.status === 'worked').length;
    const offDays = shifts.filter(item => item.status === 'off').length;
    const sales = shifts.reduce((sum, item) => sum + Number(item.sales_amount || 0), 0);
    const activeEmployees = employees.filter(item => item.status === 'active').length;

    const cards = [
        ['fa-users', 'Nhân viên đang làm', activeEmployees, 'text-blue-600'],
        ['fa-calendar-check', 'Ca đã xếp', workedDays, 'text-emerald-600'],
        ['fa-calendar-xmark', 'Ca nghỉ', offDays, 'text-amber-600'],
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

function renderShiftNameOptions() {
    const datalist = $('shiftNameOptions');
    if (!datalist) return;
    datalist.innerHTML = shiftTemplates
        .map(item => `<option value="${item.name}">${formatTimeRange(item)}</option>`)
        .join('');
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

function renderEmployeeManagement() {
    const rows = employees.map(employee => {
        const employeeShifts = shifts.filter(item => item.employee_id === employee.id);
        const worked = employeeShifts.filter(item => item.status === 'worked').length;
        const off = employeeShifts.filter(item => item.status === 'off').length;
        const statusClass = employee.status === 'active'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="px-5 py-4">
                    <div class="font-black text-slate-800 dark:text-white">${employee.name}</div>
                    <div class="text-xs text-slate-500 mt-1">ID: ${employee.id}</div>
                </td>
                <td class="px-5 py-4">${employee.phone || 'Chưa có'}</td>
                <td class="px-5 py-4 text-right font-bold">${money.format(Number(employee.daily_rate || 0))}</td>
                <td class="px-5 py-4 text-right font-bold">${Number(employee.commission_rate || 0)}%</td>
                <td class="px-5 py-4 text-center">
                    <span class="font-black text-slate-800 dark:text-white">${worked}</span>
                    <span class="text-xs text-slate-400">làm</span>
                    <span class="mx-1 text-slate-300">/</span>
                    <span class="font-black text-rose-600">${off}</span>
                    <span class="text-xs text-slate-400">nghỉ</span>
                </td>
                <td class="px-5 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-black ${statusClass}">
                        ${employee.status === 'active' ? 'Đang làm' : 'Nghỉ việc'}
                    </span>
                </td>
                <td class="px-5 py-4 text-right">
                    <button type="button" class="edit-employee-row w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" data-id="${employee.id}" title="Sửa nhân viên">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    $('employeeManageTableBody').innerHTML = rows.length ? rows.join('') : `
        <tr>
            <td colspan="7" class="px-5 py-16 text-center text-slate-400">
                <i class="fa-solid fa-users text-4xl mb-3"></i>
                <p class="font-bold">Chưa có nhân viên.</p>
            </td>
        </tr>
    `;
}

function renderShifts() {
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
    const weekDates = [];

    for (let i = 0; i < 7; i += 1) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        weekDates.push(d);
    }

    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    $('currentWeekLabel').innerText = `${firstDay.getDate()}/${firstDay.getMonth() + 1} - ${lastDay.getDate()}/${lastDay.getMonth() + 1}`;

    const headCells = weekDates.map((d, index) => {
        const isToday = formatDate(d) === today();
        return `<th class="p-3 min-w-[150px] border-l border-slate-200 dark:border-slate-700 text-center ${isToday ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : ''}">
            <div class="font-black">${daysOfWeek[index]}</div>
            <div class="text-xs font-normal opacity-70 mt-1">${d.getDate()}/${d.getMonth() + 1}</div>
        </th>`;
    }).join('');

    $('weeklyScheduleHead').innerHTML = `
        <tr>
            <th class="p-3 w-44 min-w-44 text-left bg-slate-50 dark:bg-slate-800/70">Ca làm</th>
            ${headCells}
        </tr>
    `;

    $('weeklyScheduleBody').innerHTML = shiftTemplates.map(template => {
        const dayCells = weekDates.map(date => {
            const dateStr = formatDate(date);
            const cellShifts = shifts
                .filter(shift => shift.shift_date === dateStr && shiftMatchesTemplate(shift, template))
                .sort((a, b) => employeeName(a.employee_id).localeCompare(employeeName(b.employee_id), 'vi'));

            const assignments = cellShifts.map(shift => {
                const isOff = shift.status === 'off';
                const color = isOff
                    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300';
                return `
                    <button type="button" class="edit-shift w-full text-left text-xs mb-2 p-2 rounded-lg border ${color} hover:shadow-sm transition-shadow" data-id="${shift.id}" title="Bấm để sửa">
                        <span class="flex items-center justify-between gap-2">
                            <span class="font-black truncate"><i class="fa-solid ${isOff ? 'fa-user-slash' : 'fa-user-clock'} opacity-60 mr-1"></i>${employeeName(shift.employee_id)}</span>
                            ${shift.sales_amount ? `<span class="text-[10px] font-black">${money.format(shift.sales_amount)}</span>` : ''}
                        </span>
                        ${shift.note ? `<span class="block mt-1 opacity-70 truncate">${shift.note}</span>` : ''}
                    </button>
                `;
            }).join('');

            return `<td class="p-2 border-l border-slate-200 dark:border-slate-700 align-top bg-white dark:bg-slate-900 min-h-[120px]">
                ${assignments}
                <button type="button" class="add-shift-cell w-full min-h-9 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-1 font-bold text-xs" data-date="${dateStr}" data-template-id="${template.id}" title="Thêm nhân viên vào ca">
                    <i class="fa-solid fa-plus"></i> Nhân viên
                </button>
            </td>`;
        }).join('');

        return `<tr>
            <th class="p-3 align-top text-left bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                        <div class="font-black text-slate-800 dark:text-white truncate">${template.name}</div>
                        <div class="text-xs text-slate-500 mt-1">${formatTimeRange(template)}</div>
                    </div>
                    <button type="button" class="edit-shift-template w-8 h-8 shrink-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700" data-template-id="${template.id}" title="Sửa tên và giờ ca">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </div>
            </th>
            ${dayCells}
        </tr>`;
    }).join('');
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

function fillEmployeeForm(employee) {
    $('employeeId').value = employee.id;
    $('employeeName').value = employee.name;
    $('employeePhone').value = employee.phone || '';
    $('dailyRate').value = Number(employee.daily_rate || 0);
    $('commissionRate').value = Number(employee.commission_rate || 0);
    $('employeeStatus').value = employee.status || 'active';
    $('employeeName').focus();
}

function resetShiftForm() {
    $('shiftForm').reset();
    $('shiftId').value = '';
    $('shiftDate').value = today();
    $('shiftName').value = 'Sáng';
    $('startTime').value = '07:00';
    $('endTime').value = '14:00';
    $('shiftSales').value = 0;
    $('shiftStatus').value = 'worked';
    $('deleteShiftBtn').classList.add('hidden');
    renderEmployeeOptions();
}

function applyTemplateToShiftForm(template) {
    $('shiftName').value = template.name;
    $('startTime').value = template.start_time || '';
    $('endTime').value = template.end_time || '';
}

function openShiftModal() {
    $('shiftModal').classList.remove('hidden');
}

async function loadData() {
    employees = await getEmployees();
    shifts = await getShifts({ from: $('filterFrom').value, to: $('filterTo').value });
    ensureTemplatesFromShifts();
    renderEmployeeOptions();
    renderShiftNameOptions();
    renderEmployees();
    renderEmployeeManagement();
    renderSummary();
    renderShifts();
    renderPayroll();
}

function addShiftTemplate() {
    const name = prompt('Tên ca mới', 'Ca mới');
    if (!name?.trim()) return;

    const startTime = prompt('Giờ bắt đầu', '07:00') || '';
    const endTime = prompt('Giờ kết thúc', '14:00') || '';
    shiftTemplates.push({
        id: createLocalId('shift-template'),
        name: name.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim()
    });
    saveShiftTemplates();
    renderShiftNameOptions();
    renderShifts();
}

async function editShiftTemplate(templateId) {
    const template = shiftTemplates.find(item => item.id === templateId);
    if (!template) return;

    const nextName = prompt('Tên ca', template.name);
    if (!nextName?.trim()) return;
    const nextStart = prompt('Giờ bắt đầu', template.start_time || '') || '';
    const nextEnd = prompt('Giờ kết thúc', template.end_time || '') || '';

    const previous = { ...template };
    template.name = nextName.trim();
    template.start_time = nextStart.trim();
    template.end_time = nextEnd.trim();
    saveShiftTemplates();

    const relatedShifts = shifts.filter(shift => shiftMatchesTemplate(shift, previous));
    for (const shift of relatedShifts) {
        await saveShift({
            ...shift,
            shift_name: template.name,
            start_time: template.start_time,
            end_time: template.end_time
        });
    }

    await loadData();
}

function bindEvents() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(item => item.setAttribute('aria-selected', 'false'));
            button.setAttribute('aria-selected', 'true');
            const view = button.dataset.view;
            $('scheduleView').classList.toggle('hidden', view !== 'schedule');
            $('employeeManageView').classList.toggle('hidden', view !== 'employees');
            $('payrollView').classList.toggle('hidden', view !== 'payroll');
        });
    });

    $('employeeForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
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
        } catch (error) {
            console.error('Lỗi khi thêm nhân viên:', error);
            alert(`Lỗi khi thêm nhân viên: ${error.message || error.details || 'Không xác định'}`);
        }
    });

    $('employeeList').addEventListener('click', (event) => {
        const button = event.target.closest('.edit-employee');
        if (!button) return;

        const employee = employees.find(item => item.id === button.dataset.id);
        if (!employee) return;

        fillEmployeeForm(employee);
    });

    $('employeeManageTableBody').addEventListener('click', (event) => {
        const button = event.target.closest('.edit-employee-row');
        if (!button) return;

        const employee = employees.find(item => item.id === button.dataset.id);
        if (!employee) return;

        fillEmployeeForm(employee);
    });

    const closeModals = () => {
        $('shiftModal').classList.add('hidden');
    };

    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModals));

    $('weeklyScheduleBody').addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-shift');
        const addButton = event.target.closest('.add-shift-cell');
        const templateButton = event.target.closest('.edit-shift-template');

        if (templateButton) {
            await editShiftTemplate(templateButton.dataset.templateId);
            return;
        }

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
            $('deleteShiftBtn').classList.remove('hidden');
            openShiftModal();
            return;
        }

        if (addButton) {
            resetShiftForm();
            $('shiftDate').value = addButton.dataset.date;
            const template = shiftTemplates.find(item => item.id === addButton.dataset.templateId);
            if (template) applyTemplateToShiftForm(template);
            openShiftModal();
        }
    });

    $('newShiftTemplateBtn').addEventListener('click', addShiftTemplate);

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
            shift_name: $('shiftName').value.trim(),
            start_time: $('startTime').value,
            end_time: $('endTime').value,
            sales_amount: $('shiftStatus').value === 'off' ? 0 : $('shiftSales').value,
            status: $('shiftStatus').value,
            note: $('shiftNote').value
        });
        resetShiftForm();
        closeModals();
        await loadData();
    });

    $('deleteShiftBtn').addEventListener('click', async () => {
        const id = $('shiftId').value;
        if (id && confirm('Xóa ca làm này?')) {
            await deleteShift(id);
            resetShiftForm();
            closeModals();
            await loadData();
        }
    });

    $('filterFrom').addEventListener('change', () => {
        currentWeekStart = getMonday($('filterFrom').value);
        loadData();
    });
    $('filterTo').addEventListener('change', loadData);
    $('resetEmployeeForm').addEventListener('click', resetEmployeeForm);
    $('newEmployeeBtn').addEventListener('click', () => {
        resetEmployeeForm();
        $('employeeName').focus();
    });
    $('resetShiftForm').addEventListener('click', resetShiftForm);

    async function loadWeek(offset) {
        currentWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 6);

        $('filterFrom').value = formatDate(currentWeekStart);
        $('filterTo').value = formatDate(end);
        await loadData();
    }

    $('prevWeekBtn').addEventListener('click', () => loadWeek(-1));
    $('nextWeekBtn').addEventListener('click', () => loadWeek(1));

    $('thisMonthBtn').addEventListener('click', async () => {
        currentWeekStart = getMonday(new Date());
        const { first, last } = monthRange();
        $('filterFrom').value = first;
        $('filterTo').value = last;
        await loadData();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    initLayout('admin', 'employees');
    shiftTemplates = readShiftTemplates();
    const { first, last } = monthRange();
    $('filterFrom').value = first;
    $('filterTo').value = last;
    resetEmployeeForm();
    resetShiftForm();
    bindEvents();
    await loadData();
});
