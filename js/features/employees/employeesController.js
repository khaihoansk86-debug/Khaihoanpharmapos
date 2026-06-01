import { initLayout } from '../../components/layout.js';
import { deleteShift, deleteEmployee, getEmployees, getShifts, saveEmployee, saveShift } from './employeeService.js';

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
let currentViewMode = 'week'; // 'week' hoặc 'month'

const DEFAULT_ROLE_PERMISSIONS = {
    admin: [
        'access_pos', 'access_products', 'manage_products', 'access_cost_price', 'access_invoices',
        'manage_invoices', 'access_inventory', 'manage_inventory', 'access_employees', 'manage_shifts',
        'access_payroll', 'access_overview', 'access_customers', 'access_suppliers',
        'access_settings'
    ],
    manager: [
        'access_pos', 'access_products', 'manage_products', 'access_cost_price', 'access_invoices',
        'manage_invoices', 'access_inventory', 'manage_inventory', 'access_payroll', 'access_customers',
        'access_suppliers', 'manage_shifts'
    ],
    staff: [
        'access_pos', 'access_products', 'access_invoices', 'access_customers'
    ]
};

const PERMISSION_METADATA = {
    access_pos: { label: 'Bán hàng (POS)', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50' },
    access_products: { label: 'Xem hàng', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    manage_products: { label: 'Sửa hàng', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300' },
    access_cost_price: { label: 'Xem giá vốn', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 font-black' },
    access_invoices: { label: 'Xem hóa đơn', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' },
    manage_invoices: { label: 'Hủy/Sửa HĐ', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' },
    access_inventory: { label: 'Xem kho', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300' },
    manage_inventory: { label: 'QL kho', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300' },
    access_employees: { label: 'QL nhân sự', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300' },
    manage_shifts: { label: 'Xếp ca', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 border border-violet-200 dark:border-violet-900/50 font-black' },
    access_payroll: { label: 'Xem lương', color: 'bg-lime-50 text-lime-700 dark:bg-lime-950/30 dark:text-lime-300' },
    access_overview: { label: 'Báo cáo', color: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-300' },
    access_customers: { label: 'QL khách', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300' },
    access_suppliers: { label: 'QL nhà CC', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300' },
    access_settings: { label: 'Cài đặt hệ thống', color: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' }
};

function getSelectedPermissions() {
    return Array.from(document.querySelectorAll('.permission-checkbox:checked')).map(cb => cb.value);
}

function setSelectedPermissions(perms) {
    const list = perms || [];
    document.querySelectorAll('.permission-checkbox').forEach(cb => {
        cb.checked = list.includes(cb.value);
    });
}

function applyRoleDefaultPermissions(role) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[role] || [];
    setSelectedPermissions(defaults);
}

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
    if (localStorage.getItem(SHIFT_TEMPLATES_KEY)) {
        return; // Không tự động đồng bộ lại nếu người dùng đã tùy chỉnh ca làm việc
    }
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

        // Render Vai trò
        let roleLabel = 'Nhân viên';
        let roleColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        if (employee.role === 'admin') {
            roleLabel = 'Quản trị viên';
            roleColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        } else if (employee.role === 'manager') {
            roleLabel = 'Quản lý';
            roleColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        }
        const roleBadge = `<span class="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${roleColor}">${roleLabel}</span>`;

        // Render danh sách Quyền hạn chi tiết dưới dạng Tag
        const permsList = employee.permissions || DEFAULT_ROLE_PERMISSIONS[employee.role || 'staff'] || [];
        const permsBadges = permsList.map(p => {
            const meta = PERMISSION_METADATA[p];
            if (!meta) return '';
            return `<span class="inline-block text-[10px] font-black px-2 py-0.5 rounded-md ${meta.color} mr-1 mb-1 shadow-sm shrink-0">${meta.label}</span>`;
        }).join('');

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="px-5 py-4">
                    <div class="font-black text-slate-800 dark:text-white">${employee.name}</div>
                    <div class="text-[11px] text-slate-500 mt-1"><i class="fa-solid fa-user opacity-60 mr-1"></i>User: <span class="font-black text-blue-600">${employee.username || 'chưa tạo'}</span></div>
                </td>
                <td class="px-5 py-4">${roleBadge}</td>
                <td class="px-5 py-4 max-w-md whitespace-normal">${permsBadges || '<span class="text-xs text-slate-400 font-bold italic">Không có quyền</span>'}</td>
                <td class="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">${employee.phone || 'Chưa có'}</td>
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
                    <div class="inline-flex gap-2">
                        <button type="button" class="edit-employee-row w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" data-id="${employee.id}" title="Sửa nhân viên">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="delete-employee-row w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" data-id="${employee.id}" title="Xóa nhân viên">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    $('employeeManageTableBody').innerHTML = rows.length ? rows.join('') : `
        <tr>
            <td colspan="9" class="px-5 py-16 text-center text-slate-400">
                <i class="fa-solid fa-users text-4xl mb-3"></i>
                <p class="font-bold">Chưa có nhân viên.</p>
            </td>
        </tr>
    `;
}

function renderMonthlyCalendar() {
    const year = currentWeekStart.getFullYear();
    const month = currentWeekStart.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startGrid = new Date(firstDayOfMonth);
    const day = startGrid.getDay();
    const diff = startGrid.getDate() - day + (day === 0 ? -6 : 1);
    startGrid.setDate(diff);

    const gridDates = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(startGrid);
        d.setDate(d.getDate() + i);
        gridDates.push(d);
    }
    
    let showWeeks = 6;
    if (gridDates[35].getMonth() !== month) {
        showWeeks = 5;
    }
    const finalGridDates = gridDates.slice(0, showWeeks * 7);

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    $('currentWeekLabel').innerText = `${monthNames[month]} / ${year}`;

    const gridHtml = finalGridDates.map(date => {
        const dateStr = formatDate(date);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = dateStr === today();
        
        const dayShifts = shifts.filter(s => s.shift_date === dateStr);

        const assignmentsHtml = dayShifts.map(shift => {
            const isOff = shift.status === 'off';
            const color = isOff
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/50'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50';
            return `
                <div class="edit-shift text-[10px] p-1.5 border rounded-lg font-bold flex items-center justify-between gap-1 cursor-pointer truncate ${color}" data-id="${shift.id}" title="${employeeName(shift.employee_id)} - ca ${shift.shift_name} (${isOff ? 'Nghỉ' : 'Làm'})">
                    <span class="truncate"><i class="fa-solid ${isOff ? 'fa-user-slash' : 'fa-user-clock'} mr-1 opacity-70"></i>${employeeName(shift.employee_id)}: ${shift.shift_name}</span>
                </div>
            `;
        }).join('');

        const bgClass = isToday 
            ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-400 ring-2 ring-blue-500/20' 
            : (isCurrentMonth ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/40 opacity-60');

        return `
            <div class="border rounded-2xl p-3 flex flex-col gap-2 min-h-[110px] shadow-sm transition-all hover:shadow bg-white dark:bg-slate-900 ${bgClass}">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black ${isCurrentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}">${date.getDate()}</span>
                    <button type="button" class="add-shift-cell w-6 h-6 flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" data-date="${dateStr}">
                        <i class="fa-solid fa-plus text-[9px]"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto max-h-[85px] custom-scrollbar space-y-1.5">
                    ${assignmentsHtml}
                </div>
            </div>
        `;
    }).join('');

    $('monthlyCalendarGrid').innerHTML = gridHtml;
}

function renderShifts() {
    if (currentViewMode === 'month') {
        renderMonthlyCalendar();
        return;
    }
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
                    <div class="flex gap-0.5 shrink-0">
                        <button type="button" class="edit-shift-template w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700" data-template-id="${template.id}" title="Sửa tên và giờ ca">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button type="button" class="delete-shift-template w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700" data-template-id="${template.id}" title="Xóa ca">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
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
    $('shiftEndDate').value = '';
    $('bulkDateRangeCheck').checked = false;
    
    $('shiftEndDateCol').classList.add('hidden');
    $('shiftDateCol').classList.remove('col-span-1');
    $('shiftDateCol').classList.add('col-span-2');
    $('shiftDateLabel').innerText = 'Ngày xếp ca';
    
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

function openShiftTemplateModal(template = null) {
    if (template) {
        $('shiftTemplateModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-blue-600"></i> Sửa ca làm việc';
        $('templateIdInput').value = template.id;
        $('templateNameInput').value = template.name;
        $('templateStartTimeInput').value = template.start_time || '07:00';
        $('templateEndTimeInput').value = template.end_time || '14:00';
    } else {
        $('shiftTemplateModalTitle').innerHTML = '<i class="fa-solid fa-clock text-blue-600"></i> Thêm ca làm việc mới';
        $('templateIdInput').value = '';
        $('templateNameInput').value = '';
        $('templateStartTimeInput').value = '07:00';
        $('templateEndTimeInput').value = '14:00';
    }
    $('shiftTemplateModal').classList.remove('hidden');
    $('templateNameInput').focus();
}

function closeTemplateModals() {
    $('shiftTemplateModal').classList.add('hidden');
}

async function deleteShiftTemplate(templateId) {
    const template = shiftTemplates.find(item => item.id === templateId);
    if (!template) return;

    if (confirm(`Bạn có chắc chắn muốn xóa ca "${template.name}" không? Dòng ca này sẽ bị loại bỏ khỏi bảng lịch tuần, nhưng các ca đã lưu trong dữ liệu của nhân viên vẫn sẽ được giữ lại.`)) {
        shiftTemplates = shiftTemplates.filter(item => item.id !== templateId);
        saveShiftTemplates();
        await loadData();
    }
}

async function editShiftTemplate(templateId) {
    const template = shiftTemplates.find(item => item.id === templateId);
    if (!template) return;
    openShiftTemplateModal(template);
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

    $('employeeManageTableBody').addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-employee-row');
        const deleteButton = event.target.closest('.delete-employee-row');

        if (editButton) {
            const employee = employees.find(item => item.id === editButton.dataset.id);
            if (!employee) return;
            fillEmployeeForm(employee);
            return;
        }

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const employee = employees.find(item => item.id === id);
            if (!employee) return;

            if (confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.name}" không? Thao tác này không thể hoàn tác!`)) {
                try {
                    await deleteEmployee(id);
                    resetEmployeeForm();
                    await loadData();
                    alert('Đã xóa nhân viên thành công!');
                } catch (error) {
                    console.error('Lỗi khi xóa nhân viên:', error);
                    alert(`Lỗi khi xóa nhân viên: ${error.message || 'Không xác định'}`);
                }
            }
        }
    });

    const closeModals = () => {
        $('shiftModal').classList.add('hidden');
    };

    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModals));

    const handleShiftTableClick = async (event) => {
        const editButton = event.target.closest('.edit-shift');
        const addButton = event.target.closest('.add-shift-cell');
        const templateButton = event.target.closest('.edit-shift-template');
        const deleteTemplateButton = event.target.closest('.delete-shift-template');

        if (deleteTemplateButton) {
            await deleteShiftTemplate(deleteTemplateButton.dataset.templateId);
            return;
        }

        if (templateButton) {
            await editShiftTemplate(templateButton.dataset.templateId);
            return;
        }

        if (editButton) {
            const shift = shifts.find(item => item.id === editButton.dataset.id);
            if (!shift) return;
            
            // Tắt chế độ hàng loạt khi sửa ca đơn lẻ
            $('bulkDateRangeCheck').checked = false;
            $('shiftEndDateCol').classList.add('hidden');
            $('shiftDateCol').classList.remove('col-span-1');
            $('shiftDateCol').classList.add('col-span-2');
            $('shiftEndDate').value = '';
            $('shiftDateLabel').innerText = 'Ngày xếp ca';

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
            if (addButton.dataset.templateId) {
                const template = shiftTemplates.find(item => item.id === addButton.dataset.templateId);
                if (template) applyTemplateToShiftForm(template);
            }
            openShiftModal();
        }
    };

    $('weeklyScheduleBody').addEventListener('click', handleShiftTableClick);
    $('monthlyCalendarGrid').addEventListener('click', handleShiftTableClick);

    $('bulkDateRangeCheck').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            $('shiftEndDateCol').classList.remove('hidden');
            $('shiftDateCol').classList.remove('col-span-2');
            $('shiftDateCol').classList.add('col-span-1');
            $('shiftDateLabel').innerText = 'Ngày bắt đầu';
            if ($('shiftDate').value) {
                const start = parseLocalDate($('shiftDate').value);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                $('shiftEndDate').value = formatDate(end);
            }
        } else {
            $('shiftEndDateCol').classList.add('hidden');
            $('shiftDateCol').classList.remove('col-span-1');
            $('shiftDateCol').classList.add('col-span-2');
            $('shiftDateLabel').innerText = 'Ngày xếp ca';
            $('shiftEndDate').value = '';
        }
    });

    // Toggle Tuần / Tháng
    $('viewWeekModeBtn').addEventListener('click', () => {
        currentViewMode = 'week';
        $('viewMonthModeBtn').className = 'px-3 py-1.5 rounded-lg text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all';
        $('viewWeekModeBtn').className = 'px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow-sm transition-all';
        
        $('weeklyScheduleContainer').classList.remove('hidden');
        $('monthlyScheduleContainer').classList.add('hidden');
        $('scheduleViewTitle').innerText = 'Bảng xếp ca tuần';

        currentWeekStart = getMonday(currentWeekStart);
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 6);

        $('filterFrom').value = formatDate(currentWeekStart);
        $('filterTo').value = formatDate(end);

        loadData();
    });

    $('viewMonthModeBtn').addEventListener('click', () => {
        currentViewMode = 'month';
        $('viewWeekModeBtn').className = 'px-3 py-1.5 rounded-lg text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all';
        $('viewMonthModeBtn').className = 'px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow-sm transition-all';
        
        $('weeklyScheduleContainer').classList.add('hidden');
        $('monthlyScheduleContainer').classList.remove('hidden');
        $('scheduleViewTitle').innerText = 'Lịch xếp ca tháng';

        const year = currentWeekStart.getFullYear();
        const month = currentWeekStart.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        let startGrid = new Date(firstDayOfMonth);
        const day = startGrid.getDay();
        const diff = startGrid.getDate() - day + (day === 0 ? -6 : 1);
        startGrid.setDate(diff);

        const endGrid = new Date(startGrid);
        endGrid.setDate(endGrid.getDate() + 41);

        $('filterFrom').value = formatDate(startGrid);
        $('filterTo').value = formatDate(endGrid);

        loadData();
    });

    $('newShiftTemplateBtn').addEventListener('click', () => openShiftTemplateModal(null));

    document.querySelectorAll('.close-template-modal').forEach(btn => btn.addEventListener('click', closeTemplateModals));

    $('shiftTemplateForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = $('templateIdInput').value;
        const name = $('templateNameInput').value.trim();
        const startTime = $('templateStartTimeInput').value;
        const endTime = $('templateEndTimeInput').value;

        if (!name) return;

        if (id) {
            const template = shiftTemplates.find(item => item.id === id);
            if (template) {
                const previous = { ...template };
                template.name = name;
                template.start_time = startTime;
                template.end_time = endTime;
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
            }
        } else {
            shiftTemplates.push({
                id: createLocalId('shift-template'),
                name: name,
                start_time: startTime,
                end_time: endTime
            });
            saveShiftTemplates();
        }

        closeTemplateModals();
        await loadData();
    });

    $('shiftForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!$('shiftEmployee').value) {
            alert('Bạn cần thêm nhân viên trước khi xếp ca.');
            return;
        }

        try {
            const isBulk = $('bulkDateRangeCheck').checked && $('shiftEndDate').value;

            if (isBulk) {
                const start = parseLocalDate($('shiftDate').value);
                const end = parseLocalDate($('shiftEndDate').value);
                if (end < start) {
                    alert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
                    return;
                }

                const dates = [];
                let current = new Date(start);
                while (current <= end) {
                    dates.push(formatDate(current));
                    current.setDate(current.getDate() + 1);
                }

                for (const dStr of dates) {
                    await saveShift({
                        id: null,
                        employee_id: $('shiftEmployee').value,
                        shift_date: dStr,
                        shift_name: $('shiftName').value.trim(),
                        start_time: $('startTime').value,
                        end_time: $('endTime').value,
                        sales_amount: $('shiftStatus').value === 'off' ? 0 : Number($('shiftSales').value || 0),
                        status: $('shiftStatus').value,
                        note: $('shiftNote').value
                    });
                }
            } else {
                await saveShift({
                    id: $('shiftId').value || null,
                    employee_id: $('shiftEmployee').value,
                    shift_date: $('shiftDate').value,
                    shift_name: $('shiftName').value.trim(),
                    start_time: $('startTime').value,
                    end_time: $('endTime').value,
                    sales_amount: $('shiftStatus').value === 'off' ? 0 : Number($('shiftSales').value || 0),
                    status: $('shiftStatus').value,
                    note: $('shiftNote').value
                });
            }
            resetShiftForm();
            closeModals();
            await loadData();
            if (window.showToast) window.showToast('Xếp ca làm việc thành công!', 'success');
        } catch (error) {
            console.error('Lỗi khi xếp ca làm việc:', error);
            alert(`Lỗi xếp ca: ${error.message || error.details || 'Không xác định'}`);
        }
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
        if (currentViewMode === 'month') {
            currentWeekStart.setMonth(currentWeekStart.getMonth() + offset);
            currentWeekStart.setDate(1);

            const year = currentWeekStart.getFullYear();
            const month = currentWeekStart.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            let startGrid = new Date(firstDayOfMonth);
            const day = startGrid.getDay();
            const diff = startGrid.getDate() - day + (day === 0 ? -6 : 1);
            startGrid.setDate(diff);

            const endGrid = new Date(startGrid);
            endGrid.setDate(endGrid.getDate() + 41);

            $('filterFrom').value = formatDate(startGrid);
            $('filterTo').value = formatDate(endGrid);
        } else {
            currentWeekStart.setDate(currentWeekStart.getDate() + (offset * 7));
            const end = new Date(currentWeekStart);
            end.setDate(end.getDate() + 6);

            $('filterFrom').value = formatDate(currentWeekStart);
            $('filterTo').value = formatDate(end);
        }
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
