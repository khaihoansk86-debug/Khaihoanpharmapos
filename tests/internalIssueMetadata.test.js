const { execFileSync } = require('child_process');

describe('internal issue metadata helpers', () => {
    function runCheck(scriptBody) {
        execFileSync('node', ['--input-type=module', '-e', scriptBody], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
    }

    test('build note appends target tags and parse recovers clean values', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { buildInternalIssueNote, parseInternalIssueNote } from './js/features/inventory/internalIssueMetadata.js';

            const note = buildInternalIssueNote({
                note: '[XUAT NOI BO] Phong tiem',
                targetType: 'department',
                targetName: 'Phong tiem'
            });

            const parsed = parseInternalIssueNote(note);
            assert.equal(parsed.targetType, 'department');
            assert.equal(parsed.targetName, 'Phong tiem');
            assert.equal(parsed.targetLabel, 'Phòng / Bộ phận');
            assert.equal(parsed.userNote, '[XUAT NOI BO] Phong tiem');
        `);
    });

    test('parse handles notes without tags', () => {
        runCheck(`
            import assert from 'node:assert/strict';
            import { parseInternalIssueNote } from './js/features/inventory/internalIssueMetadata.js';

            const parsed = parseInternalIssueNote('Ghi chu thu cong');
            assert.equal(parsed.targetType, '');
            assert.equal(parsed.targetName, '');
            assert.equal(parsed.userNote, 'Ghi chu thu cong');
        `);
    });
});
