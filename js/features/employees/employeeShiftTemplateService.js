import { buildEmployeeShiftDisplayTemplates } from './employeeShiftDisplayRules.js';

const TEMPLATE_IDS = new Set(['morning', 'afternoon']);
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function normalizeTemplate(template = {}) {
    const id = String(template.id || '');
    const startTime = String(template.start_time || '').slice(0, 5);
    const endTime = String(template.end_time || '').slice(0, 5);
    if (!TEMPLATE_IDS.has(id) || !TIME_PATTERN.test(startTime)
        || !TIME_PATTERN.test(endTime) || endTime <= startTime) {
        throw new Error('INVALID_SHIFT_TEMPLATE');
    }
    return { id, start_time: startTime, end_time: endTime };
}

export async function fetchEmployeeShiftTemplates(client) {
    if (!client?.from) return buildEmployeeShiftDisplayTemplates();
    const { data, error } = await client
        .from('employee_shift_templates')
        .select('id, name, start_time, end_time')
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return buildEmployeeShiftDisplayTemplates(data || []);
}

export async function saveEmployeeShiftTemplate(template, client) {
    if (!client?.from) throw new Error('SHIFT_TEMPLATE_SERVER_UNAVAILABLE');
    const normalized = normalizeTemplate(template);
    const { error } = await client
        .from('employee_shift_templates')
        .update({
            start_time: normalized.start_time,
            end_time: normalized.end_time
        })
        .eq('id', normalized.id);
    if (error) throw error;
    return normalized;
}
