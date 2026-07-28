import { supabaseClient } from '../../core/supabase.js';
import { provisionEmployeeAuth } from './employeeAuthProvisioningService.js';

const EMPLOYEES_KEY = 'khp_employees';
const SHIFTS_KEY = 'khp_employee_shifts';
let employeesTableAvailable = null;
let shiftsTableAvailable = null;

function normalizeTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':').map(Number);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
}

function isTimeInInterval(timeSec, startSec, endSec) {
    if (endSec >= startSec) return timeSec >= startSec && timeSec < endSec;
    return timeSec >= startSec || timeSec < endSec;
}

function compareStartAsc(a, b) {
    const startDiff = normalizeTimeToSeconds(a.start_time) - normalizeTimeToSeconds(b.start_time);
    if (startDiff !== 0) return startDiff;

    const endDiff = normalizeTimeToSeconds(a.end_time) - normalizeTimeToSeconds(b.end_time);
    if (endDiff !== 0) return endDiff;

    const createdA = Date.parse(a.created_at || 0);
    const createdB = Date.parse(b.created_at || 0);
    if (createdA !== createdB) return createdA - createdB;

    return String(a.id || '').localeCompare(String(b.id || ''));
}

function compareStartDesc(a, b) {
    return compareStartAsc(b, a);
}

function compareCreatedAsc(a, b) {
    const createdA = Date.parse(a.created_at || 0);
    const createdB = Date.parse(b.created_at || 0);
    if (createdA !== createdB) return createdA - createdB;

    return String(a.id || '').localeCompare(String(b.id || ''));
}

function currentTimeSeconds(date = new Date()) {
    return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function todayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function resolveGuardReferenceDate(value) {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function pickTimeMatchedShift(shifts, currentSec) {
    const timeMatched = (shifts || []).filter((shift) => {
        if (!shift.start_time || !shift.end_time) return false;
        return isTimeInInterval(
            currentSec,
            normalizeTimeToSeconds(shift.start_time),
            normalizeTimeToSeconds(shift.end_time)
        );
    });

    if (!timeMatched.length) return null;
    timeMatched.sort(compareCreatedAsc);
    return timeMatched[0];
}

function pickNextEmployeeShift(shifts, currentSec, employeeId) {
    const employeeShifts = (shifts || []).filter((shift) => shift.employee_id === employeeId && !shift.is_closed);
    if (!employeeShifts.length) return null;

    const worked = employeeShifts.filter((shift) => shift.status === 'worked');
    const candidates = worked.length ? worked : employeeShifts;
    const upcoming = candidates
        .filter((shift) => normalizeTimeToSeconds(shift.start_time) >= currentSec)
        .sort(compareStartAsc);
    if (upcoming.length) return upcoming[0];

    return [...candidates].sort(compareStartDesc)[0] || null;
}

function resolveExpectedShiftForPOSSync(shifts, referenceDate, employeeId, allowOutOfShiftFallback) {
    const currentSec = currentTimeSeconds(referenceDate);
    const openWorkedShifts = (shifts || []).filter((shift) => shift.status === 'worked' && !shift.is_closed);
    const matchedShift = pickTimeMatchedShift(openWorkedShifts, currentSec);
    if (matchedShift) return matchedShift;
    if (!allowOutOfShiftFallback || !employeeId) return null;
    return pickNextEmployeeShift(shifts || [], currentSec, employeeId);
}

function hasShiftMoneyValues(payload) {
    return [
        payload.cash_amount,
        payload.bank_amount,
        payload.cash_exchange_amount,
        payload.sales_amount,
        payload.out_of_shift_sales
    ].some((value) => Number(value || 0) > 0);
}

async function assertShiftUpdateIsSafe(payload, shift = {}) {
    if (!hasShiftMoneyValues(payload)) return;

    const now = new Date();
    if (payload.shift_date && payload.shift_date > todayKey(now)) {
        throw new Error(`Khong duoc ghi doanh so vao ca tuong lai (${payload.shift_date}).`);
    }

    if (shift.__source !== 'pos-sync' || !payload.id) return;

    const referenceDate = resolveGuardReferenceDate(shift.__syncReferenceDate);
    const { data: dayShifts, error } = await supabaseClient
        .from('employee_shifts')
        .select('*')
        .eq('shift_date', payload.shift_date);
    if (error) throw error;

    const expectedShift = resolveExpectedShiftForPOSSync(
        dayShifts || [],
        referenceDate,
        payload.employee_id,
        shift.__allowOutOfShiftFallback === true
    );

    if (!expectedShift || expectedShift.id !== payload.id) {
        throw new Error(
            `Chan ghi sai ca cho don ${shift.__syncOrderCode || ''}: ca hop le la ${expectedShift?.shift_name || 'khong co'}, khong phai ${payload.shift_name || payload.id}.`
        );
    }
}

function uuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLocal(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

async function canUseTable(tableName, cachedValue) {
    if (!supabaseClient) return false;
    if (cachedValue.value !== null) return cachedValue.value;

    try {
        const { error } = await supabaseClient
            .from(tableName)
            .select('id')
            .limit(1);

        if (error) {
            // Chỉ cache false nếu là lỗi quyền / bảng không tồn tại (PGRST*, 42P01)
            // Không cache nếu là lỗi mạng thoáng qua để lần sau có thể thử lại
            const isNetworkError = !error.code || error.message === 'Failed to fetch'
                || (error.message && error.message.toLowerCase().includes('network'))
                || error.message === 'Load failed';
            if (isNetworkError) {
                console.warn(`[employeeService] Lỗi mạng khi kiểm tra bảng ${tableName}, sẽ thử lại lần sau.`);
                return false; // Trả về false nhưng KHÔNG cache - để lần sau thử lại
            }
            cachedValue.value = false; // Lỗi cố định (không có bảng, không có quyền) → cache
            return false;
        }
        cachedValue.value = true;
        return true;
    } catch (e) {
        // Lỗi mạng exception - không cache
        console.warn(`[employeeService] Exception khi kiểm tra bảng ${tableName}:`, e.message);
        return false;
    }
}

function isValidUUID(str) {
    if (!str) return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
}

async function canUseEmployeesTable() {
    return canUseTable('employees', {
        get value() { return employeesTableAvailable; },
        set value(next) { employeesTableAvailable = next; }
    });
}

async function canUseShiftsTable() {
    if (!(await canUseEmployeesTable())) return false; // Buộc đồng bộ: Nếu bảng nhân viên dùng local thì bảng ca làm cũng dùng local
    return canUseTable('employee_shifts', {
        get value() { return shiftsTableAvailable; },
        set value(next) { shiftsTableAvailable = next; }
    });
}

export async function getEmployees() {
    if (await canUseEmployeesTable()) {
        let allEmployees = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;
        while (hasMore) {
            const { data, error } = await supabaseClient
                .from('employees')
                .select('*')
                .order('name', { ascending: true })
                .range(page * pageSize, (page + 1) * pageSize - 1);
            if (error) throw error;
            if (data && data.length > 0) {
                allEmployees = allEmployees.concat(data);
                if (data.length < pageSize) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }
        return allEmployees;
    }

    return readLocal(EMPLOYEES_KEY).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function saveEmployee(employee) {
    const username = String(employee.username || '').trim();
    const password = String(employee.password || '');
    if (!employee.id && (!username || password.length < 6)) {
        throw new Error('Nhân viên mới cần tên đăng nhập và mật khẩu từ 6 ký tự.');
    }
    if (password && !username) {
        throw new Error('Cần tên đăng nhập khi đặt mật khẩu.');
    }

    const payload = {
        name: employee.name.trim(),
        phone: employee.phone || null,
        daily_rate: Number(employee.daily_rate || 0),
        commission_rate: Number(employee.commission_rate || 0),
        status: employee.status || 'active',
        role: employee.role || 'staff',
        permissions: employee.permissions || [],
        updated_at: new Date().toISOString()
    };

    if (employee.id) payload.id = employee.id;

    if (await canUseEmployeesTable()) {
        const query = payload.id
            ? supabaseClient.from('employees').update(payload).eq('id', payload.id)
            : supabaseClient.from('employees').insert([payload]);

        const { data, error } = await query.select().single();
        if (error) throw error;
        if (password) {
            await provisionEmployeeAuth(supabaseClient, {
                employeeId: data.id,
                username,
                password
            });
            return { ...data, username };
        }
        return data;
    }

    if (password || !employee.id) {
        throw new Error('Cần kết nối mạng để tạo hoặc đổi tài khoản nhân viên.');
    }

    const employees = readLocal(EMPLOYEES_KEY);
    if (!payload.id) payload.id = uuid();
    const index = employees.findIndex(item => item.id === payload.id);
    if (index >= 0) {
        const existing = employees[index];
        employees[index] = { ...existing, ...payload };
    } else {
        employees.push({ ...payload, created_at: new Date().toISOString() });
    }
    writeLocal(EMPLOYEES_KEY, employees);
    return payload;
}

export async function getShifts({ from, to } = {}) {
    if (await canUseShiftsTable()) {
        let query = supabaseClient
            .from('employee_shifts')
            .select('*')
            .order('shift_date', { ascending: false });

        if (from) query = query.gte('shift_date', from);
        if (to) query = query.lte('shift_date', to);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    return readLocal(SHIFTS_KEY)
        .filter(item => (!from || item.shift_date >= from) && (!to || item.shift_date <= to))
        .sort((a, b) => b.shift_date.localeCompare(a.shift_date));
}

export async function saveShift(shift) {
    const payload = {
        employee_id: shift.employee_id,
        shift_date: shift.shift_date,
        shift_name: shift.shift_name || 'Sáng',
        start_time: shift.start_time || null,
        end_time: shift.end_time || null,
        cash_amount: Number(shift.cash_amount || 0),
        bank_amount: Number(shift.bank_amount || 0),
        cash_exchange_amount: Number(shift.cash_exchange_amount || 0),
        sales_amount: Number(shift.sales_amount || 0),
        out_of_shift_sales: Number(shift.out_of_shift_sales || 0),
        status: shift.status || 'worked',
        note: shift.note || null,
        updated_at: new Date().toISOString()
    };

    if (Object.prototype.hasOwnProperty.call(shift, 'is_closed')) {
        payload.is_closed = shift.is_closed ?? false;
    }
    if (Object.prototype.hasOwnProperty.call(shift, 'closed_at')) {
        payload.closed_at = shift.closed_at || null;
    }

    // Chỉ gán id vào payload nếu id đó là một UUID hợp lệ
    const hasValidUuid = shift.id && isValidUUID(shift.id);
    if (hasValidUuid) payload.id = shift.id;

    if (await canUseShiftsTable()) {
        // Nếu employee_id không phải là một UUID hợp lệ thì không thể ghi vào Supabase
        if (!isValidUUID(payload.employee_id)) {
            console.warn("employee_id không hợp lệ (không phải UUID), chuyển sang lưu trữ cục bộ.");
        } else {
            await assertShiftUpdateIsSafe(payload, shift);
            const query = hasValidUuid
                ? supabaseClient.from('employee_shifts').update(payload).eq('id', payload.id)
                : supabaseClient.from('employee_shifts').insert([payload]);

            const { data, error } = await query.select().single();
            if (error) {
                const isMissingColumnError = error.message?.includes('is_closed') ||
                                             error.message?.includes('closed_at') ||
                                             error.message?.includes('schema cache') ||
                                             error.code === '42703';
                if (isMissingColumnError) {
                    console.warn('[employeeService] CSDL chưa chạy migration column is_closed/closed_at, thử lại với schema cũ.');
                    const legacyPayload = { ...payload };
                    delete legacyPayload.is_closed;
                    delete legacyPayload.closed_at;

                    const retryQuery = hasValidUuid
                        ? supabaseClient.from('employee_shifts').update(legacyPayload).eq('id', legacyPayload.id)
                        : supabaseClient.from('employee_shifts').insert([legacyPayload]);

                    const { data: retryData, error: retryError } = await retryQuery.select().single();
                    if (retryError) throw retryError;
                    return retryData;
                }
                throw error;
            }
            return data;
        }
    }

    const shifts = readLocal(SHIFTS_KEY);
    if (!payload.id) payload.id = uuid();
    const index = shifts.findIndex(item => item.id === payload.id);
    if (index >= 0) shifts[index] = { ...shifts[index], ...payload };
    else shifts.push({ ...payload, created_at: new Date().toISOString() });
    writeLocal(SHIFTS_KEY, shifts);
    return payload;
}

export async function deleteShift(id) {
    if (await canUseShiftsTable()) {
        if (!isValidUUID(id)) {
            // ID không phải UUID hợp lệ thì chắc chắn chỉ ở local storage
            writeLocal(SHIFTS_KEY, readLocal(SHIFTS_KEY).filter(item => item.id !== id));
            return;
        }
        const { error } = await supabaseClient
            .from('employee_shifts')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return;
    }

    writeLocal(SHIFTS_KEY, readLocal(SHIFTS_KEY).filter(item => item.id !== id));
}

export async function deleteEmployee(id) {
    if (await canUseEmployeesTable()) {
        async function verifyDeleted() {
            const { data: remaining, error: verifyError } = await supabaseClient
                .from('employees')
                .select('id')
                .eq('id', id)
                .maybeSingle();
            if (verifyError) throw verifyError;
            return !remaining;
        }

        const { error } = await supabaseClient
            .from('employees')
            .delete()
            .eq('id', id);
        if (error) throw error;
        if (await verifyDeleted()) return;

        const { error: rpcError } = await supabaseClient.rpc('delete_employee_profile', {
            employee_id_to_delete: id
        });
        if (rpcError) {
            throw new Error(`Chưa cài hàm xóa nhân viên trong Supabase. Hãy chạy lại migration 011_allow_delete_employees.sql. Chi tiết: ${rpcError.message}`);
        }
        if (!(await verifyDeleted())) {
            throw new Error('Supabase vẫn chưa xóa được nhân viên. Hãy kiểm tra migration 011_allow_delete_employees.sql đã chạy trên đúng project chưa.');
        }
        return;
    }

    writeLocal(EMPLOYEES_KEY, readLocal(EMPLOYEES_KEY).filter(item => item.id !== id));
    writeLocal(SHIFTS_KEY, readLocal(SHIFTS_KEY).filter(item => item.employee_id !== id));
}
