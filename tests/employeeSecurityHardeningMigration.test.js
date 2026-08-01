const fs = require('fs');
const path = require('path');

describe('employee security hardening migration 080', () => {
    const migrationPath = path.join(
        process.cwd(),
        'supabase/migrations/080_harden_employee_management.sql'
    );

    test('retires password hashes and blocks staff from direct shift writes', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(/UPDATE public\.employees SET password_hash = NULL/i);
        expect(sql).toMatch(/DROP FUNCTION IF EXISTS public\.authenticate_employee_legacy/i);
        expect(sql).toMatch(/REVOKE (?:ALL|SELECT) ON public\.employees FROM (?:anon, )?authenticated/i);
        expect(sql).toMatch(/GRANT SELECT \([^)]*\) ON public\.employees TO authenticated/is);
        expect(sql).not.toMatch(/employee_id\s*=\s*public\.current_employee_id\(\)[\s\S]*FOR (INSERT|UPDATE)/i);
    });

    test('provides protected POS amount sync, atomic scheduling, and two templates', () => {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.sync_current_employee_shift_amounts/i);
        expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.save_employee_shifts_bulk/i);
        expect(sql).toMatch(/CREATE UNIQUE INDEX[^;]+employee_id[^;]+shift_date[^;]+lower\s*\(\s*trim\s*\(\s*shift_name/is);
        expect(sql).toMatch(/CREATE TABLE public\.employee_shift_templates/i);
        expect(sql).toContain("('morning', 'Sáng'");
        expect(sql).toContain("('afternoon', 'Chiều'");
    });
});
