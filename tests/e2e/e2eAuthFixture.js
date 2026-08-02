export const SUPABASE_AUTH_STORAGE_KEY = 'sb-iejgtdcdzababydaqjef-auth-token';

function encodeJwtSegment(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function createE2EAuthSession(employeeId = 'e2e-admin') {
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    const accessToken = [
        encodeJwtSegment({ alg: 'HS256', typ: 'JWT' }),
        encodeJwtSegment({
            aud: 'authenticated',
            exp: expiresAt,
            role: 'authenticated',
            sub: employeeId
        }),
        'e2e-signature'
    ].join('.');

    return {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: expiresAt,
        refresh_token: 'e2e-refresh-token',
        user: {
            id: employeeId,
            aud: 'authenticated',
            role: 'authenticated'
        }
    };
}

export async function mockE2EEmployeeProfile(page, employeeId = 'e2e-admin') {
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url().includes('/rest/v1/rpc/get_current_employee_profile')) {
            const corsHeaders = {
                'access-control-allow-origin': 'http://127.0.0.1:3000',
                'access-control-allow-headers': 'authorization, apikey, content-profile, content-type, x-client-info, x-supabase-api-version',
                'access-control-allow-methods': 'POST, OPTIONS',
                'content-profile': 'public'
            };
            if (request.method() === 'OPTIONS') {
                request.respond({ status: 204, headers: corsHeaders });
                return;
            }
            request.respond({
                status: 200,
                contentType: 'application/json',
                headers: corsHeaders,
                body: JSON.stringify([{
                    id: employeeId,
                    name: 'Admin E2E',
                    username: 'admin',
                    role: 'admin',
                    status: 'active',
                    permissions: []
                }])
            });
            return;
        }
        request.continue();
    });
}
