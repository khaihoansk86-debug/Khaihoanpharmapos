const { execFileSync } = require('child_process');

describe('employee presentation rules', () => {
    test('escapes hostile text and attributes before HTML rendering', () => {
        execFileSync('node', ['--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { escapeEmployeeHtml } from './js/features/employees/employeePresentationRules.js';
            assert.equal(
                escapeEmployeeHtml('\"><img src=x onerror=alert(1)>'),
                '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;'
            );
            assert.equal(escapeEmployeeHtml(null), '');
        `], { cwd: process.cwd(), stdio: 'pipe' });
    });
});
