import { createClient } from '@supabase/supabase-js';
import {
    buildSePayWebhookRecord,
    getSePayWebhookAuthFailure
} from '../js/features/payments/sepayWebhookRules.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authFailure = getSePayWebhookAuthFailure(
        process.env.SEPAY_WEBHOOK_TOKEN,
        req.headers.authorization
    );
    if (authFailure) {
        return res.status(authFailure.status).json({ error: authFailure.error });
    }

    try {
        const parsedPayload = buildSePayWebhookRecord(req.body);
        if (!parsedPayload.ok) {
            return res.status(400).json({ error: parsedPayload.error });
        }

        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceRoleKey) {
            return res.status(503).json({ error: 'Server configuration error.' });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const { error } = await supabase
            .from('sepay_webhooks')
            .upsert(parsedPayload.record, {
                onConflict: 'transaction_id',
                ignoreDuplicates: true
            });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Webhook received successfully'
        });
    } catch (error) {
        console.error('[sepay-webhook] Internal processing error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
