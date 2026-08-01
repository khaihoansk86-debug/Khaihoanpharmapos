import { initLayout } from '../../components/layout.js';
import { supabaseClient } from '../../core/supabase.js';
import { deleteShift, deleteEmployee, getEmployees, getShifts, saveEmployee, saveShift } from './employeeService.js';
import { fetchEmployeeDirectory } from './employeeDirectoryService.js';
import {
    DEFAULT_ROLE_PERMISSIONS,
    getDefaultPermissionsForRole,
    resolveEmployeePermissions,
    shouldAutoApplyRoleDefaults
} from './employeePermissionRules.js';
import { getShiftSalesBreakdown } from '../pos/shiftAmountRules.js';
import { reconcileShiftSalesFromOrders } from '../pos/shiftRevenueReconciliationService.js?v=20260712a';
import {
    formatPayrollMonthLabel,
    getPayrollMonthRange,
    normalizePayrollMonth,
    shiftPayrollMonth
} from './employeePayrollPeriodRules.js';
import {
    calculateEmployeePayroll,
    getEmployeeMonthlyAllowance,
    getEmployeeMonthlySalary
} from './employeePayrollRules.js';
import {
    resolvePayrollEmployeeForPeriod
} from './employeePayrollPeriodSettingsRules.js';
import {
    fetchEmployeePayrollPeriodSettings,
    saveEmployeePayrollPeriodSetting
} from './employeePayrollPeriodSettingsService.js';
import {
    canViewAllEmployeePayroll,
    filterPayrollEmployeesForViewer,
    mergeEmployeeDirectoryWithProfiles
} from './employeePayrollVisibilityRules.js';

const money = new Intl.NumberFormat('vi-VN');
const SHIFT_TEMPLATES_KEY = 'khp_shift_templates';
const DELETED_SHIFT_TEMPLATES_KEY = 'khp_deleted_shift_templates';
const DEFAULT_SHIFT_TEMPLATES = [
    { id: 'morning', name: 'Sáng', start_time: '07:00', end_time: '14:00' },
    { id: 'afternoon', name: 'Chiều', start_time: '14:00', end_time: '21:00' },
    { id: 'full-day', name: 'Cả ngày', start_time: '07:00', end_time: '21:00' }
];

let employees = [];
let shifts = [];
let payrollShifts = [];
let payrollPeriodSettings = new Map();
let shiftTemplates = [];
let currentWeekStart = getMonday(new Date());
let payrollMonth = normalizePayrollMonth(new Date());
let currentViewMode = 'week'; // 'week' hoặc 'month'

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

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('pos_user') || 'null');
    } catch {
        return null;
    }
}

function getCurrentUserPermissions() {
    const user = getCurrentUser();
    if (!user) return [];
    return resolveEmployeePermissions(user);
}

function hasPermission(permission) {
    return getCurrentUserPermissions().includes(permission);
}

function canAccessEmployeeView(view) {
    if (view === 'schedule') return hasPermission('manage_shifts') || canViewAllEmployeePayroll(getCurrentUser());
    if (view === 'employees') return canViewAllEmployeePayroll(getCurrentUser());
    if (view === 'payroll') return hasPermission('access_payroll') || canViewAllEmployeePayroll(getCurrentUser());
    return false;
}

function activateEmployeeView(view) {
    const targetView = canAccessEmployeeView(view)
        ? view
        : (['schedule', 'employees', 'payroll'].find(canAccessEmployeeView) || 'schedule');

    document.querySelectorAll('.tab-button').forEach(button => {
        const isActive = button.dataset.view === targetView;
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    $('scheduleView')?.classList.toggle('hidden', targetView !== 'schedule');
    $('employeeManageView')?.classList.toggle('hidden', targetView !== 'employees');
    $('payrollView')?.classList.toggle('hidden', targetView !== 'payroll');
}

function applyEmployeePermissions() {
    const canManageEmployees = canAccessEmployeeView('employees');
    const canManageShifts = canAccessEmployeeView('schedule');
    const canViewPayroll = canAccessEmployeeView('payroll');

    $('employeeForm')?.closest('aside')?.classList.toggle('hidden', !canManageEmployees);
    $('editPayrollPeriodBtn')?.classList.toggle('hidden', !canManageShifts);

    document.querySelectorAll('.tab-button').forEach(button => {
        const allowed = canAccessEmployeeView(button.dataset.view);
        button.classList.toggle('hidden', !allowed);
        button.disabled = !allowed;
    });

    $('scheduleView')?.classList.toggle('hidden', !canManageShifts);
    $('employeeManageView')?.classList.add('hidden');
    $('payrollView')?.classList.add('hidden');

    if (canManageShifts) activateEmployeeView('schedule');
    else if (canManageEmployees) activateEmployeeView('employees');
    else if (canViewPayroll) activateEmployeeView('payroll');
}

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
    setSelectedPermissions(getDefaultPermissionsForRole(role));
}

function renderPermissionChecklist() {
    const container = $('permissionChecklist');
    if (!container) return;

    container.innerHTML = Object.entries(PERMISSION_METADATA).map(([permission, meta]) => `
        <label class="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/20">
            <input type="checkbox" value="${permission}" class="permission-checkbox mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
            <span class="min-w-0">
                <span class="block">${meta.label}</span>
                <span class="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-black ${meta.color}">${permission}</span>
            </span>
        </label>
    `).join('');
}

function syncRoleDefaultsOnChange() {
    const roleInput = $('employeeRole');
    if (!roleInput) return;

    const previousRole = roleInput.dataset.previousRole || 'staff';
    const selectedPermissions = getSelectedPermissions();
    if (shouldAutoApplyRoleDefaults(selectedPermissions, previousRole)) {
        applyRoleDefaultPermissions(roleInput.value);
    }
    roleInput.dataset.previousRole = roleInput.value;
}

const $ = (id) => document.getElementById(id);

function num(value) {
    return Number(value || 0);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function getShiftFinalAmount(source = {}) {
    const cash = num(source.cash_amount);
    const bank = num(source.bank_amount);
    const exchange = num(source.cash_exchange_amount);
    return Math.max(0, cash + bank - exchange);
}

function updateShiftFinalAmount() {
    const sales = num($('shiftSales')?.value);
    const outOfShift = num($('shiftOutOfShiftSales')?.value);
    const finalAmount = getShiftFinalAmount({
        cash_amount: $('shiftCashAmount')?.value,
        bank_amount: $('shiftBankAmount')?.value,
        cash_exchange_amount: $('shiftCashExchangeAmount')?.value
    }) + sales + outOfShift;
    if ($('shiftFinalAmountPreview')) $('shiftFinalAmountPreview').textContent = money.format(finalAmount);
    return finalAmount;
}

function getShiftFormPayload(overrides = {}) {
    const status = $('shiftStatus')?.value || 'worked';
    const isOff = status === 'off';
    const finalAmount = updateShiftFinalAmount();
    return {
        id: $('shiftId')?.value || null,
        employee_id: $('shiftEmployee')?.value,
        shift_date: $('shiftDate')?.value,
        shift_name: $('shiftName')?.value.trim(),
        start_time: $('startTime')?.value,
        end_time: $('endTime')?.value,
        cash_amount: isOff ? 0 : Number($('shiftCashAmount')?.value || 0),
        bank_amount: isOff ? 0 : Number($('shiftBankAmount')?.value || 0),
        cash_exchange_amount: isOff ? 0 : Number($('shiftCashExchangeAmount')?.value || 0),
        sales_amount: isOff ? 0 : finalAmount,
        out_of_shift_sales: isOff ? 0 : Number($('shiftOutOfShiftSales')?.value || 0),
        status,
        note: $('shiftNote')?.value || '',
        ...overrides
    };
}

function getEditingShift() {
    const id = $('shiftId')?.value;
    if (!id) return null;
    return shifts.find(item => item.id === id) || null;
}

function updateEndShiftButton() {
    const button = $('endShiftBtn');
    const reopenBtn = $('reopenShiftBtn');
    const badge = $('shiftClosedBadge');
    if (!button) return;

    const shift = getEditingShift();
    if (!shift || $('bulkDateRangeCheck')?.checked) {
        button.classList.add('hidden');
        reopenBtn?.classList.add('hidden');
        badge?.classList.add('hidden');
        return;
    }

    const isWorked = $('shiftStatus')?.value === 'worked';
    
    if (shift.is_closed) {
        button.classList.add('hidden');
        if (isWorked) {
            reopenBtn?.classList.remove('hidden');
            if (badge) {
                badge.classList.remove('hidden');
                const timeStr = shift.closed_at ? new Date(shift.closed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                const dateStr = shift.closed_at ? new Date(shift.closed_at).toLocaleDateString('vi-VN') : '';
                $('shiftClosedBadgeText').innerText = `Ca này đã kết thúc lúc ${timeStr} ngày ${dateStr}.`;
            }
        } else {
            reopenBtn?.classList.add('hidden');
            badge?.classList.add('hidden');
        }
    } else {
        reopenBtn?.classList.add('hidden');
        badge?.classList.add('hidden');
        const canEnd = isWorked && shift.status === 'worked';
        button.classList.toggle('hidden', !canEnd);
    }
}

function getShiftMoneySummary(shift) {
    const cash = num(shift.cash_amount);
    const bank = num(shift.bank_amount);
    const finalAmount = num(shift.sales_amount);
    const outOfShift = num(shift.out_of_shift_sales);
    if (!cash && !bank && !finalAmount && !outOfShift) return '';
    let parts = [];
    if (cash) parts.push(`TM ${money.format(cash)}`);
    if (bank) parts.push(`CK ${money.format(bank)}`);
    if (finalAmount) parts.push(`Cuối ${money.format(finalAmount)}`);
    if (outOfShift) parts.push(`Ngoài ca ${money.format(outOfShift)}`);
    return parts.join(' | ');
}

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
        const raw = localStorage.getItem(SHIFT_TEMPLATES_KEY);
        if (raw === null) return DEFAULT_SHIFT_TEMPLATES;
        return JSON.parse(raw || '[]');
    } catch {
        return DEFAULT_SHIFT_TEMPLATES;
    }
}

function readDeletedShiftTemplateKeys() {
    try {
        return new Set(JSON.parse(localStorage.getItem(DELETED_SHIFT_TEMPLATES_KEY) || '[]'));
    } catch {
        return new Set();
    }
}

function saveDeletedShiftTemplateKeys(keys) {
    localStorage.setItem(DELETED_SHIFT_TEMPLATES_KEY, JSON.stringify([...keys]));
}

function saveShiftTemplates() {
    // Chỉ lưu các ca làm việc cố định (không có thuộc tính isTemporary) vào localStorage
    const persistent = shiftTemplates.filter(item => !item.isTemporary);
    localStorage.setItem(SHIFT_TEMPLATES_KEY, JSON.stringify(persistent));
}

function employeeName(id) {
    return employees.find(item => item.id === id)?.name || 'Không rõ';
}

function ensureTemplatesFromShifts() {
    // 1. Nạp các ca cố định từ localStorage trước
    const persistent = readShiftTemplates();
    const activeKeys = new Set(persistent.map(item => templateKey(item)));
    const deletedKeys = readDeletedShiftTemplateKeys();

    // 2. Thêm các ca làm việc tạm thời từ dữ liệu ca của khoảng thời gian đang xem
    const active = [...persistent];
    shifts.forEach(shift => {
        const normStart = normalizeTime(shift.start_time);
        const normEnd = normalizeTime(shift.end_time);
        const template = {
            id: createLocalId('shift-template'),
            name: shift.shift_name || 'Ca làm',
            start_time: normStart,
            end_time: normEnd,
            isTemporary: true
        };
        const key = templateKey(template);
        if (!activeKeys.has(key) && !deletedKeys.has(key)) {
            activeKeys.add(key);
            active.push(template);
        }
    });

    shiftTemplates = active;
}

function templateKey(item) {
    return `${item.name || ''}|${normalizeTime(item.start_time)}|${normalizeTime(item.end_time)}`;
}

function normalizeTime(t) {
    if (!t) return '';
    return String(t).slice(0, 5);
}

function formatTimeRange(item) {
    if (!item.start_time && !item.end_time) return 'Chưa set giờ';
    return `${normalizeTime(item.start_time) || '--:--'} - ${normalizeTime(item.end_time) || '--:--'}`;
}

function shiftMatchesTemplate(shift, template) {
    return (shift.shift_name || '') === template.name
        && normalizeTime(shift.start_time) === normalizeTime(template.start_time)
        && normalizeTime(shift.end_time) === normalizeTime(template.end_time);
}

function getShiftDayIndex(shift) {
    if (!shift || !shift.shift_date) return 0;

    // Lọc tất cả các ca làm việc của ngày đó
    const dayShifts = shifts.filter(s => s.shift_date === shift.shift_date && s.status === 'worked');

    // Trích xuất các ca duy nhất (không trùng tên, giờ bắt đầu/kết thúc)
    const distinctShifts = [];
    dayShifts.forEach(s => {
        const exists = distinctShifts.some(ds =>
            ds.shift_name === s.shift_name &&
            normalizeTime(ds.start_time) === normalizeTime(s.start_time) &&
            normalizeTime(ds.end_time) === normalizeTime(s.end_time)
        );
        if (!exists) {
            distinctShifts.push({
                shift_name: s.shift_name,
                start_time: s.start_time,
                end_time: s.end_time
            });
        }
    });

    // Sắp xếp các ca theo giờ bắt đầu tăng dần
    distinctShifts.sort((a, b) => {
        const timeA = a.start_time || '00:00:00';
        const timeB = b.start_time || '00:00:00';
        return timeA.localeCompare(timeB);
    });

    // Tìm vị trí của ca hiện tại
    const index = distinctShifts.findIndex(ds =>
        ds.shift_name === shift.shift_name &&
        normalizeTime(ds.start_time) === normalizeTime(shift.start_time) &&
        normalizeTime(ds.end_time) === normalizeTime(shift.end_time)
    );

    return index >= 0 ? index : 0;
}

function getShiftColorClass(shift, isOff) {
    if (isOff) {
        return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300';
    }

    const idx = getShiftDayIndex(shift);

    const shiftThemeClasses = [
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300',      // Ca 1: Blue
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300',  // Ca 2: Amber
        'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/20 dark:text-violet-300',  // Ca 3: Violet
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300',// Ca 4: Emerald
        'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-cyan-300'       // Ca 5: Cyan
    ];

    return shiftThemeClasses[idx % shiftThemeClasses.length];
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
        ['fa-chart-line', 'Doanh số ca nhân viên ghi nhận', money.format(sales), 'text-violet-600']
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
        const permsList = resolveEmployeePermissions(employee);
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
                <td class="px-5 py-4 text-right font-bold">${money.format(getEmployeeMonthlySalary(employee))}</td>
                <td class="px-5 py-4 text-right font-bold">${money.format(getEmployeeMonthlyAllowance(employee))}</td>
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
            <td colspan="10" class="px-5 py-16 text-center text-slate-400">
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
            const color = getShiftColorClass(shift, isOff);
            const moneySummary = getShiftMoneySummary(shift);
            return `
                <div class="edit-shift text-[10px] p-1.5 border rounded-lg font-bold flex items-center justify-between gap-1 cursor-pointer truncate ${color}" data-id="${shift.id}" title="${employeeName(shift.employee_id)} - ca ${shift.shift_name} (${isOff ? 'Nghỉ' : 'Làm'})${moneySummary ? ` - ${moneySummary}` : ''}">
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
                const color = getShiftColorClass(shift, isOff);
                const moneySummary = getShiftMoneySummary(shift);
                return `
                    <button type="button" class="edit-shift w-full text-left text-xs mb-2 p-2 rounded-lg border ${color} hover:shadow-sm transition-shadow" data-id="${shift.id}" title="${moneySummary || 'Bấm để sửa'}">
                        <span class="flex items-center justify-between gap-2">
                            <span class="font-black truncate"><i class="fa-solid ${isOff ? 'fa-user-slash' : 'fa-user-clock'} opacity-60 mr-1"></i>${employeeName(shift.employee_id)}</span>
                            ${shift.sales_amount ? `<span class="text-[10px] font-black">${money.format(shift.sales_amount)}</span>` : ''}
                        </span>
                        ${moneySummary ? `<span class="block mt-1 opacity-75 truncate">${moneySummary}</span>` : ''}
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
    const viewer = getCurrentUser();
    const canViewAll = canViewAllEmployeePayroll(viewer);
    const payrollEmployees = filterPayrollEmployeesForViewer(
        employees,
        viewer
    );
    if ($('payrollPrivacyNoticeText')) {
        $('payrollPrivacyNoticeText').textContent = canViewAll
            ? 'Chế độ quản trị: bạn đang xem bảng lương của tất cả nhân viên.'
            : `Bảng lương cá nhân của ${viewer?.name || 'bạn'}. Chỉ bạn và quản trị viên có thể xem.`;
    }

    const rows = payrollEmployees.map(employee => {
        const periodSetting = payrollPeriodSettings.get(employee.id) || null;
        const effectiveEmployee = resolvePayrollEmployeeForPeriod(employee, periodSetting);
        const escapedEmployeeName = escapeHtml(employee.name);
        const escapedEmployeeId = escapeHtml(employee.id);
        const employeeShifts = payrollShifts.filter(item => item.employee_id === employee.id);
        const payroll = calculateEmployeePayroll({
            employee: effectiveEmployee,
            shifts: employeeShifts
        });
        const leaveNote = payroll.unusedLeaveDays
            ? '+1 phép chưa nghỉ'
            : (payroll.paidLeaveDays
                ? `${payroll.paidLeaveDays} phép hưởng lương`
                : 'Không có phép');
        const unpaidNote = payroll.unpaidLeaveDays
            ? `${payroll.unpaidLeaveDays} ngày không lương`
            : leaveNote;
        const restNote = `${payroll.restDays} nghỉ quy ước`;
        const absenceNote = `${restNote} · ${unpaidNote}`;

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="px-5 py-4 font-bold">
                    <div>${escapedEmployeeName}</div>
                    <span class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${periodSetting ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}">
                        ${periodSetting ? 'Theo kỳ' : 'Theo hồ sơ'}
                    </span>
                </td>
                <td class="px-5 py-4 text-right">
                    <div class="font-black">${payroll.workedDays}</div>
                    <div class="text-[10px] text-slate-400">${payroll.recordedWorkedDays} ngày ghi nhận · ${payroll.paidDays} ngày tính lương</div>
                </td>
                <td class="px-5 py-4 text-right">
                    <div class="font-black">${payroll.restDays + payroll.leaveDays}</div>
                    <div class="text-[10px] ${payroll.unpaidLeaveDays ? 'text-rose-500' : 'text-emerald-500'}">${absenceNote}</div>
                </td>
                <td class="px-5 py-4 text-right">${money.format(payroll.sales)}</td>
                <td class="px-5 py-4 text-right">
                    <div class="font-black">${money.format(payroll.basePay)}</div>
                    <div class="text-[10px] text-slate-400">${money.format(payroll.monthlySalary)} / 27 ngày</div>
                </td>
                <td class="px-5 py-4 text-right font-black text-amber-600">${money.format(payroll.allowance)}</td>
                <td class="px-5 py-4 text-right">
                    <div class="font-black">${money.format(payroll.commission)}</div>
                    <div class="text-[10px] text-slate-400">${payroll.commissionRate}% doanh số</div>
                </td>
                <td class="px-5 py-4 text-right font-black text-blue-600">${money.format(payroll.total)}</td>
                <td class="px-5 py-4 text-right">
                    ${canViewAll ? `
                        <button type="button" class="edit-payroll-setting inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300" data-id="${escapedEmployeeId}" aria-label="Chỉnh lương theo kỳ của ${escapedEmployeeName}">
                            <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Chỉnh
                        </button>
                    ` : '<span class="text-slate-300 dark:text-slate-600">—</span>'}
                </td>
            </tr>
        `;
    });

    $('payrollTableBody').innerHTML = rows.length ? rows.join('') : `
        <tr><td colspan="9" class="px-5 py-16 text-center text-slate-400 font-bold">Không tìm thấy dữ liệu lương của tài khoản này.</td></tr>
    `;
    if ($('payrollPeriodLabel')) {
        $('payrollPeriodLabel').textContent = formatPayrollMonthLabel(payrollMonth);
    }
}

function renderEmployeeCompensationPreview() {
    const monthlySalary = Math.max(0, Number($('monthlySalary')?.value || 0));
    const monthlyAllowance = Math.max(0, Number($('monthlyAllowance')?.value || 0));
    const dailyRate = monthlySalary / 27;
    const paidLeaveTotal = monthlySalary + monthlyAllowance;
    const unusedLeaveTotal = paidLeaveTotal + dailyRate;

    if ($('employeeDailyRatePreview')) {
        $('employeeDailyRatePreview').textContent = money.format(Math.round(dailyRate));
    }
    if ($('employeePaidLeavePreview')) {
        $('employeePaidLeavePreview').textContent = money.format(Math.round(paidLeaveTotal));
    }
    if ($('employeeUnusedLeavePreview')) {
        $('employeeUnusedLeavePreview').textContent = money.format(Math.round(unusedLeaveTotal));
    }
}

function resetEmployeeForm() {
    $('employeeForm').reset();
    $('employeeId').value = '';
    $('monthlySalary').value = 0;
    $('monthlyAllowance').value = 0;
    $('commissionRate').value = 0;
    $('employeeStatus').value = 'active';
    $('employeeUsername').value = '';
    $('employeePassword').value = '';
    $('employeePasswordHint').textContent = 'Nhân viên mới cần mật khẩu từ 6 ký tự.';
    renderEmployeeCompensationPreview();
}

function fillEmployeeForm(employee) {
    $('employeeId').value = employee.id;
    $('employeeName').value = employee.name;
    $('employeePhone').value = employee.phone || '';
    $('monthlySalary').value = getEmployeeMonthlySalary(employee);
    $('monthlyAllowance').value = getEmployeeMonthlyAllowance(employee);
    $('commissionRate').value = Number(employee.commission_rate || 0);
    $('employeeStatus').value = employee.status || 'active';
    $('employeeUsername').value = employee.username || '';
    $('employeePassword').value = '';
    $('employeePasswordHint').textContent = 'Để trống mật khẩu nếu không muốn thay đổi.';
    renderEmployeeCompensationPreview();
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
    $('shiftCashAmount').value = 0;
    $('shiftBankAmount').value = 0;
    $('shiftCashExchangeAmount').value = 0;
    $('shiftSales').value = 0;
    $('shiftOutOfShiftSales').value = 0;
    updateShiftFinalAmount();
    $('shiftStatus').value = 'worked';
    $('deleteShiftBtn').classList.add('hidden');
    $('endShiftBtn')?.classList.add('hidden');
    $('reopenShiftBtn')?.classList.add('hidden');
    $('shiftClosedBadge')?.classList.add('hidden');
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

function renderPayrollSettingInputPreviews() {
    const salary = Math.max(0, Number($('payrollSettingSalary')?.value || 0));
    const allowance = Math.max(0, Number($('payrollSettingAllowance')?.value || 0));
    if ($('payrollSettingSalaryPreview')) {
        $('payrollSettingSalaryPreview').textContent = `${money.format(salary)}đ`;
    }
    if ($('payrollSettingAllowancePreview')) {
        $('payrollSettingAllowancePreview').textContent = `${money.format(allowance)}đ`;
    }
}

function openPayrollSettingModal(employeeId) {
    if (!canAccessEmployeeView('employees')) {
        alert('Tài khoản của bạn không có quyền chỉnh thiết lập kỳ lương.');
        return;
    }

    const employee = employees.find(item => item.id === employeeId);
    if (!employee) return;
    const setting = payrollPeriodSettings.get(employee.id) || null;
    const effectiveEmployee = resolvePayrollEmployeeForPeriod(employee, setting);
    const monthKey = getPayrollMonthRange(payrollMonth).first;

    $('payrollSettingEmployeeId').value = employee.id;
    $('payrollSettingMonth').value = monthKey;
    $('payrollSettingEmployeeName').textContent = employee.name;
    $('payrollSettingPeriodLabel').textContent = formatPayrollMonthLabel(payrollMonth);
    $('payrollSettingSource').textContent = setting ? 'Đang dùng thiết lập riêng của kỳ này' : 'Đang kế thừa từ hồ sơ nhân viên';
    $('payrollSettingSalary').value = getEmployeeMonthlySalary(effectiveEmployee);
    $('payrollSettingAllowance').value = getEmployeeMonthlyAllowance(effectiveEmployee);
    $('payrollSettingCommission').value = Number(effectiveEmployee.commission_rate || 0);
    $('payrollSettingNote').value = setting?.note || '';
    renderPayrollSettingInputPreviews();
    $('payrollSettingModal').classList.remove('hidden');
    $('payrollSettingSalary').focus();
}

function closePayrollSettingModal() {
    $('payrollSettingModal').classList.add('hidden');
    $('payrollSettingForm').reset();
}

async function loadData() {
    const viewer = getCurrentUser();
    const employeeRequest = canViewAllEmployeePayroll(viewer)
        ? getEmployees()
        : Promise.all([
            fetchEmployeeDirectory(supabaseClient),
            getEmployees()
        ]).then(([directory, profiles]) => (
            mergeEmployeeDirectoryWithProfiles(directory, profiles)
        ));
    const [employeeData, periodSettingData] = await Promise.all([
        employeeRequest,
        fetchEmployeePayrollPeriodSettings(payrollMonth, supabaseClient)
    ]);
    employees = employeeData;
    payrollPeriodSettings = new Map(
        periodSettingData.map(setting => [setting.employee_id, setting])
    );
    const scheduleRange = { from: $('filterFrom').value, to: $('filterTo').value };
    const payrollRange = getPayrollMonthRange(payrollMonth);
    const usesSameRange = scheduleRange.from === payrollRange.first
        && scheduleRange.to === payrollRange.last;

    if (usesSameRange) {
        shifts = await getShifts(scheduleRange);
        payrollShifts = shifts;
    } else {
        [shifts, payrollShifts] = await Promise.all([
            getShifts(scheduleRange),
            getShifts({ from: payrollRange.first, to: payrollRange.last })
        ]);
    }
    ensureTemplatesFromShifts();
    renderEmployeeOptions();
    renderShiftNameOptions();
    renderEmployees();
    renderEmployeeManagement();
    renderSummary();
    renderShifts();
    renderPayroll();
}

async function setPayrollMonth(month) {
    payrollMonth = normalizePayrollMonth(month);
    await loadData();
}

async function openPayrollMonthForEditing() {
    if (!canAccessEmployeeView('schedule')) return;

    currentViewMode = 'month';
    currentWeekStart = normalizePayrollMonth(payrollMonth);
    const range = getPayrollMonthRange(payrollMonth);
    $('filterFrom').value = range.first;
    $('filterTo').value = range.last;

    $('viewWeekModeBtn').className = 'px-3 py-1.5 rounded-lg text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all';
    $('viewMonthModeBtn').className = 'px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow-sm transition-all';
    $('weeklyScheduleContainer').classList.add('hidden');
    $('monthlyScheduleContainer').classList.remove('hidden');
    $('scheduleViewTitle').innerText = 'Lịch xếp ca tháng';

    activateEmployeeView('schedule');
    await loadData();
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
        const deletedKeys = readDeletedShiftTemplateKeys();
        deletedKeys.add(templateKey(template));
        saveDeletedShiftTemplateKeys(deletedKeys);
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

async function endShiftFromModal() {
    const shift = getEditingShift();
    if (!shift) {
        alert('Chỉ có thể kết ca sau khi ca đã được lưu.');
        return;
    }
    if (shift.is_closed) {
        alert('Ca này đã được kết trước đó.');
        updateEndShiftButton();
        return;
    }
    if ($('shiftStatus')?.value !== 'worked') {
        alert('Chỉ có thể kết ca có trạng thái Có làm.');
        return;
    }
    if (!confirm(`Kết ca "${shift.shift_name}" ngay bây giờ? Doanh thu POS sau thời điểm này sẽ tự chuyển sang ca còn mở tiếp theo.`)) {
        return;
    }

    const button = $('endShiftBtn');
    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kết ca';
        }

        const shiftDateValue = $('shiftDate')?.value;
        const endTimeValue = $('endTime')?.value || '20:00:00';
        let closedAtIso = new Date().toISOString();
        if (shiftDateValue !== today()) {
            closedAtIso = new Date(`${shiftDateValue}T${endTimeValue}`).toISOString();
        }

        const savedShift = await saveShift(getShiftFormPayload({
            id: shift.id,
            is_closed: true,
            closed_at: closedAtIso
        }));
        if (!Object.prototype.hasOwnProperty.call(savedShift || {}, 'is_closed')) {
            throw new Error('CSDL chưa có cột is_closed/closed_at. Hãy chạy migration 026_add_is_closed_to_employee_shifts.sql rồi thử lại.');
        }
        await reconcileShiftSalesFromOrders({ referenceDate: savedShift.closed_at || savedShift.shift_date || new Date() });
        resetShiftForm();
        $('shiftModal').classList.add('hidden');
        await loadData();
        if (window.showToast) window.showToast('Đã kết ca và ghi nhận doanh thu hiện tại.', 'success');
        else alert('Đã kết ca và ghi nhận doanh thu hiện tại.');
    } catch (error) {
        console.error('Lỗi khi kết ca:', error);
        alert(`Lỗi khi kết ca: ${error.message || error.details || 'Không xác định'}`);
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> Kết ca';
        }
    }
}

async function reopenShiftFromModal() {
    const shift = getEditingShift();
    if (!shift) return;
    if (!confirm(`Bạn có chắc chắn muốn mở lại ca "${shift.shift_name}"? Doanh thu phát sinh sau khi mở lại sẽ tiếp tục được cộng dồn vào ca này.`)) {
        return;
    }
    const button = $('reopenShiftBtn');
    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang mở lại';
        }
        const savedShift = await saveShift(getShiftFormPayload({
            id: shift.id,
            is_closed: false,
            closed_at: null
        }));
        if (!Object.prototype.hasOwnProperty.call(savedShift || {}, 'is_closed')) {
            throw new Error('CSDL chưa có cột is_closed/closed_at. Hãy chạy migration 026_add_is_closed_to_employee_shifts.sql rồi thử lại.');
        }
        await reconcileShiftSalesFromOrders({ referenceDate: savedShift.shift_date || new Date() });
        resetShiftForm();
        $('shiftModal').classList.add('hidden');
        await loadData();
        if (window.showToast) window.showToast('Đã mở lại ca thành công.', 'success');
        else alert('Đã mở lại ca thành công.');
    } catch (error) {
        console.error('[employees] Lỗi mở lại ca:', error);
        alert('Lỗi khi mở lại ca: ' + error.message);
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Mở lại ca';
        }
    }
}

function bindEvents() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const view = button.dataset.view;
            if (!canAccessEmployeeView(view)) return;
            activateEmployeeView(view);
        });
    });

    ['monthlySalary', 'monthlyAllowance', 'commissionRate'].forEach(id => {
        $(id)?.addEventListener('input', renderEmployeeCompensationPreview);
    });

    ['payrollSettingSalary', 'payrollSettingAllowance'].forEach(id => {
        $(id)?.addEventListener('input', renderPayrollSettingInputPreviews);
    });

    $('payrollTableBody').addEventListener('click', (event) => {
        const button = event.target.closest('.edit-payroll-setting');
        if (!button) return;
        openPayrollSettingModal(button.dataset.id);
    });

    document.querySelectorAll('.close-payroll-setting-modal').forEach(button => {
        button.addEventListener('click', closePayrollSettingModal);
    });

    $('payrollSettingForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!canAccessEmployeeView('employees')) {
            alert('Tài khoản của bạn không có quyền chỉnh thiết lập kỳ lương.');
            return;
        }

        const submitButton = $('payrollSettingSubmitButton');
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Đang lưu...';
            await saveEmployeePayrollPeriodSetting({
                employee_id: $('payrollSettingEmployeeId').value,
                payroll_month: $('payrollSettingMonth').value,
                monthly_salary: $('payrollSettingSalary').value,
                monthly_allowance: $('payrollSettingAllowance').value,
                commission_rate: $('payrollSettingCommission').value,
                note: $('payrollSettingNote').value
            }, supabaseClient);
            closePayrollSettingModal();
            await loadData();
            if (window.showToast) window.showToast('Đã lưu thiết lập lương cho kỳ đã chọn.', 'success');
        } catch (error) {
            console.error('[employees] Không thể lưu thiết lập kỳ lương:', error);
            alert('Không thể lưu thiết lập kỳ lương. Vui lòng kiểm tra dữ liệu và thử lại.');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Lưu cho kỳ này';
        }
    });

    $('employeeForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!canAccessEmployeeView('employees')) {
            alert('Tài khoản của bạn không có quyền quản lý hồ sơ nhân viên.');
            return;
        }
        const submitButton = $('employeeSubmitButton');
        try {
            const employeeId = $('employeeId').value || null;
            const existingEmp = employees.find(item => item.id === employeeId) || {};
            const username = $('employeeUsername').value.trim();
            const password = $('employeePassword').value;
            if (!employeeId && (!username || password.length < 6)) {
                throw new Error('Nhân viên mới cần tên đăng nhập và mật khẩu từ 6 ký tự.');
            }
            if (
                employeeId
                && username !== String(existingEmp.username || '')
                && password.length < 6
            ) {
                throw new Error('Khi đổi tên đăng nhập, hãy nhập mật khẩu mới từ 6 ký tự.');
            }
            if (password && password.length < 6) {
                throw new Error('Mật khẩu cần ít nhất 6 ký tự.');
            }
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            }
            await saveEmployee({
                id: employeeId,
                name: $('employeeName').value,
                phone: $('employeePhone').value,
                monthly_salary: $('monthlySalary').value,
                monthly_allowance: $('monthlyAllowance').value,
                commission_rate: $('commissionRate').value,
                status: $('employeeStatus').value,
                username,
                password,
                role: existingEmp.role || 'staff',
                permissions: existingEmp.permissions || []
            });
            resetEmployeeForm();
            await loadData();
            if (window.showToast) {
                window.showToast('Đã lưu lương và phụ cấp nhân viên.', 'success');
            }
        } catch (error) {
            console.error('Lỗi khi thêm nhân viên:', error);
            alert(`Lỗi khi thêm nhân viên: ${error.message || error.details || 'Không xác định'}`);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu nhân viên';
            }
        }
    });

    $('toggleEmployeePassword')?.addEventListener('click', () => {
        const passwordInput = $('employeePassword');
        const button = $('toggleEmployeePassword');
        const shouldShow = passwordInput.type === 'password';
        passwordInput.type = shouldShow ? 'text' : 'password';
        button.setAttribute('aria-pressed', String(shouldShow));
        button.setAttribute('aria-label', shouldShow ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        button.innerHTML = `<i class="fa-solid ${shouldShow ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
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
    document.querySelectorAll('.shift-money-input').forEach(input => {
        input.addEventListener('input', updateShiftFinalAmount);
    });
    $('endShiftBtn')?.addEventListener('click', endShiftFromModal);
    $('reopenShiftBtn')?.addEventListener('click', reopenShiftFromModal);
    $('shiftStatus')?.addEventListener('change', updateEndShiftButton);
    $('shiftDate')?.addEventListener('change', updateEndShiftButton);

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
            $('startTime').value = normalizeTime(shift.start_time);
            $('endTime').value = normalizeTime(shift.end_time);
            $('shiftCashAmount').value = Number(shift.cash_amount || 0);
            $('shiftBankAmount').value = Number(shift.bank_amount || 0);
            $('shiftCashExchangeAmount').value = Number(shift.cash_exchange_amount || 0);
            const breakdown = getShiftSalesBreakdown(shift);
            $('shiftSales').value = breakdown.extraAmount;
            $('shiftOutOfShiftSales').value = breakdown.outOfShiftAmount;
            updateShiftFinalAmount();
            $('shiftStatus').value = shift.status;
            $('shiftNote').value = shift.note || '';
            $('deleteShiftBtn').classList.remove('hidden');
            updateEndShiftButton();
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
        updateEndShiftButton();
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
                delete template.isTemporary; // Chuyển đổi thành ca cố định nếu người dùng chỉnh sửa
                const deletedKeys = readDeletedShiftTemplateKeys();
                deletedKeys.delete(templateKey(previous));
                deletedKeys.delete(templateKey(template));
                saveDeletedShiftTemplateKeys(deletedKeys);
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
            const template = {
                id: createLocalId('shift-template'),
                name: name,
                start_time: startTime,
                end_time: endTime
            };
            const deletedKeys = readDeletedShiftTemplateKeys();
            deletedKeys.delete(templateKey(template));
            saveDeletedShiftTemplateKeys(deletedKeys);
            shiftTemplates.push(template);
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

                const finalAmount = updateShiftFinalAmount();
                const cashAmount = Number($('shiftCashAmount').value || 0);
                const bankAmount = Number($('shiftBankAmount').value || 0);
                const exchangeAmount = Number($('shiftCashExchangeAmount').value || 0);
                const outOfShiftSales = Number($('shiftOutOfShiftSales').value || 0);

                for (const dStr of dates) {
                    await saveShift({
                        id: null,
                        employee_id: $('shiftEmployee').value,
                        shift_date: dStr,
                        shift_name: $('shiftName').value.trim(),
                        start_time: $('startTime').value,
                        end_time: $('endTime').value,
                        cash_amount: $('shiftStatus').value === 'off' ? 0 : cashAmount,
                        bank_amount: $('shiftStatus').value === 'off' ? 0 : bankAmount,
                        cash_exchange_amount: $('shiftStatus').value === 'off' ? 0 : exchangeAmount,
                        sales_amount: $('shiftStatus').value === 'off' ? 0 : finalAmount,
                        out_of_shift_sales: $('shiftStatus').value === 'off' ? 0 : outOfShiftSales,
                        status: $('shiftStatus').value,
                        note: $('shiftNote').value
                    });
                }
            } else {
                await saveShift(getShiftFormPayload());
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
            try {
                await deleteShift(id);
                resetShiftForm();
                closeModals();
                await loadData();
                if (window.showToast) window.showToast('Xóa ca làm việc thành công!', 'success');
            } catch (error) {
                console.error('Lỗi khi xóa ca làm việc:', error);
                alert(`Lỗi khi xóa ca làm: ${error.message || 'Không xác định'}`);
            }
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

    $('payrollPrevMonthBtn').addEventListener('click', () => (
        setPayrollMonth(shiftPayrollMonth(payrollMonth, -1))
    ));
    $('payrollNextMonthBtn').addEventListener('click', () => (
        setPayrollMonth(shiftPayrollMonth(payrollMonth, 1))
    ));
    $('editPayrollPeriodBtn').addEventListener('click', openPayrollMonthForEditing);
    $('thisMonthBtn').addEventListener('click', () => setPayrollMonth(new Date()));
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!await initLayout('admin', 'employees')) return;
    shiftTemplates = readShiftTemplates();
    const { first, last } = monthRange();
    $('filterFrom').value = first;
    $('filterTo').value = last;
    resetEmployeeForm();
    resetShiftForm();
    applyEmployeePermissions();
    bindEvents();
    await loadData();
});
