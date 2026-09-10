import { supabaseClient } from '../../core/supabase.js';
import { ZALO_COMMANDS } from './zaloControlRules.js';

async function withDeadline(request) {
    let timer;
    try {
        return await Promise.race([request, new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Không xác định kết quả do quá thời gian chờ.')), 15000);
        })]);
    } finally { clearTimeout(timer); }
}

export async function verifyZaloAdmin() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data, error } = await withDeadline(supabaseClient.rpc('is_current_employee_admin'));
    if (error) throw error;
    return data === true;
}

export async function loadZaloControlDashboard() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const [settingsResult, runtimeResult, commandsResult] = await withDeadline(Promise.all([
        supabaseClient
            .from('zalo_bot_settings')
            .select('*')
            .limit(1)
            .maybeSingle(),
        supabaseClient
            .from('zalo_bot_runtime_status')
            .select('*')
            .order('last_heartbeat_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabaseClient
            .from('zalo_bot_commands')
            .select('id, command_type, status, requested_by, requested_at, started_at, completed_at, result, requester:employees!zalo_bot_commands_requested_by_fkey(name)')
            .order('requested_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(30)
    ]));
    const error = settingsResult.error || runtimeResult.error || commandsResult.error;
    if (error) throw error;
    return {
        settings: settingsResult.data || {},
        runtime: runtimeResult.data || null,
        commands: commandsResult.data || []
    };
}

export async function enqueueZaloCommand(commandType) {
    if (!Object.hasOwn(ZALO_COMMANDS, commandType)) throw new Error('Unsupported Zalo command');
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data, error } = await withDeadline(supabaseClient.rpc('enqueue_zalo_bot_command', {
        p_command_type: commandType,
        p_payload: {}
    }));
    if (error) throw error;
    if (typeof data !== 'string' || !/^[0-9a-f-]{36}$/i.test(data)) throw new Error('Chưa xác định mã lệnh đã tiếp nhận.');
    return data;
}
