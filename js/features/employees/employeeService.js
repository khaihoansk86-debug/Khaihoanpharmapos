import { supabaseClient } from '../../core/supabase.js';

const EMPLOYEES_KEY = 'khp_employees';
const SHIFTS_KEY = 'khp_employee_shifts';
let employeesTableAvailable = null;
let shiftsTableAvailable = null;

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

    const { error } = await supabaseClient
        .from(tableName)
        .select('id')
        .limit(1);

    cachedValue.value = !error;
    return cachedValue.value;
}

async function canUseEmployeesTable() {
    return canUseTable('employees', {
        get value() { return employeesTableAvailable; },
        set value(next) { employeesTableAvailable = next; }
    });
}

async function canUseShiftsTable() {
    return canUseTable('employee_shifts', {
        get value() { return shiftsTableAvailable; },
        set value(next) { shiftsTableAvailable = next; }
    });
}

export async function getEmployees() {
    if (await canUseEmployeesTable()) {
        const { data, error } = await supabaseClient
            .from('employees')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    return readLocal(EMPLOYEES_KEY).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

async function hashPassword(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveEmployee(employee) {
    const payload = {
        name: employee.name.trim(),
        phone: employee.phone || null,
        daily_rate: Number(employee.daily_rate || 0),
        commission_rate: Number(employee.commission_rate || 0),
        status: employee.status || 'active',
        username: employee.username ? employee.username.trim() : null,
        role: employee.role || 'staff',
        permissions: employee.permissions || [],
        updated_at: new Date().toISOString()
    };

    if (employee.password) {
        payload.password_hash = await hashPassword(employee.password);
    }

    if (employee.id) payload.id = employee.id;

    if (await canUseEmployeesTable()) {
        const query = payload.id
            ? supabaseClient.from('employees').update(payload).eq('id', payload.id)
            : supabaseClient.from('employees').insert([payload]);

        const { data, error } = await query.select().single();
        if (error) throw error;
        return data;
    }

    const employees = readLocal(EMPLOYEES_KEY);
    if (!payload.id) payload.id = uuid();
    const index = employees.findIndex(item => item.id === payload.id);
    if (index >= 0) {
        // preserve password_hash if not changed
        const existing = employees[index];
        if (!payload.password_hash && existing.password_hash) {
            payload.password_hash = existing.password_hash;
        }
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
        sales_amount: Number(shift.sales_amount || 0),
        status: shift.status || 'worked',
        note: shift.note || null,
        updated_at: new Date().toISOString()
    };
    if (shift.id) payload.id = shift.id;

    if (await canUseShiftsTable()) {
        const query = payload.id
            ? supabaseClient.from('employee_shifts').update(payload).eq('id', payload.id)
            : supabaseClient.from('employee_shifts').insert([payload]);

        const { data, error } = await query.select().single();
        if (error) throw error;
        return data;
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
