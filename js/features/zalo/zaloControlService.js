import { supabaseClient } from '../../core/supabase.js';

export async function loadZaloControlDashboard() {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const [settingsResult, runtimeResult, commandsResult] = await Promise.all([
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
            .select('id, command_type, status, requested_at, started_at, completed_at, result, error_message')
            .order('requested_at', { ascending: false })
            .limit(30)
    ]);
    const error = settingsResult.error || runtimeResult.error || commandsResult.error;
    if (error) throw error;
    return {
        settings: settingsResult.data || {},
        runtime: runtimeResult.data || null,
        commands: commandsResult.data || []
    };
}

export async function enqueueZaloCommand(commandType) {
    if (!supabaseClient) throw new Error('Supabase chưa được kết nối.');
    const { data, error } = await supabaseClient.rpc('enqueue_zalo_bot_command', {
        p_command_type: commandType,
        p_payload: {}
    });
    if (error) throw error;
    return data;
}
