// js/features/logs/auditService.js
import { supabaseClient } from '../../core/supabase.js';

/**
 * Log a critical activity.
 * @param {string} actionType - The type of activity ('login', 'return', 'internal_use', 'stocktake_adjustment')
 * @param {Object} details - Custom detail data for the log
 * @param {string} [performerName] - Optional custom name of the user performing this
 * @param {string} [performerRole] - Optional custom role of the user performing this
 */
export async function logActivity(actionType, details = {}, performerName = null, performerRole = null) {
    if (!supabaseClient) {
        console.warn('Supabase client is not available. Skipping audit log.');
        return;
    }

    try {
        let name = performerName;
        let role = performerRole;

        if (!name || !role) {
            const userStr = localStorage.getItem('pos_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (!name) name = user.name || user.username || 'System';
                if (!role) role = user.role || 'staff';
            } else {
                if (!name) name = 'System / Unauthenticated';
                if (!role) role = 'guest';
            }
        }

        const payload = {
            action_type: actionType,
            performer_name: name,
            performer_role: role,
            details: details,
            created_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
            .from('audit_logs')
            .insert([payload]);

        if (error) {
            console.error('Failed to insert audit log to Supabase:', error);
        }
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}
