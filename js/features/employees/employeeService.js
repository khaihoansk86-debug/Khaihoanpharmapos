import { supabaseClient } from '../../core/supabase.js';

const EMPLOYEES_KEY = 'khp_employees';
const SHIFTS_KEY = 'khp_employee_shifts';
let supabaseAvailable = null;

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

async function canUseSupabaseTables() {
    if (!supabaseClient) return false;
    if (supabaseAvailable !== null) return supabaseAvailable;

    const { error } = await supabaseClient
        .from('employees')
        .select('id')
        .limit(1);

    supabaseAvailable = !error;
    return supabaseAvailable;
}

export async function getEmployees() {
    if (await canUseSupabaseTables()) {
        const { data, error } = await supabaseClient
            .from('employees')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    return readLocal(EMPLOYEES_KEY).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function saveEmployee(employee) {
    const payload = {
        id: employee.id || uuid(),
        name: employee.name.trim(),
        phone: employee.phone || null,
        daily_rate: Number(employee.daily_rate || 0),
        commission_rate: Number(employee.commission_rate || 0),
        status: employee.status || 'active',
        updated_at: new Date().toISOString()
    };

    if (await canUseSupabaseTables()) {
        const { data, error } = await supabaseClient
            .from('employees')
            .upsert(payload)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    const employees = readLocal(EMPLOYEES_KEY);
    const index = employees.findIndex(item => item.id === payload.id);
    if (index >= 0) employees[index] = payload;
    else employees.push({ ...payload, created_at: new Date().toISOString() });
    writeLocal(EMPLOYEES_KEY, employees);
    return payload;
}

export async function getShifts({ from, to } = {}) {
    if (await canUseSupabaseTables()) {
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
        id: shift.id || uuid(),
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

    if (await canUseSupabaseTables()) {
        const { data, error } = await supabaseClient
            .from('employee_shifts')
            .upsert(payload)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    const shifts = readLocal(SHIFTS_KEY);
    const index = shifts.findIndex(item => item.id === payload.id);
    if (index >= 0) shifts[index] = payload;
    else shifts.push({ ...payload, created_at: new Date().toISOString() });
    writeLocal(SHIFTS_KEY, shifts);
    return payload;
}

export async function deleteShift(id) {
    if (await canUseSupabaseTables()) {
        const { error } = await supabaseClient
            .from('employee_shifts')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return;
    }

    writeLocal(SHIFTS_KEY, readLocal(SHIFTS_KEY).filter(item => item.id !== id));
}
