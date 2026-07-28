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
