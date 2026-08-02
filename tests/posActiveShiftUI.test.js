const fs = require('fs');
const path = require('path');

describe('POS active shift indicator', () => {
    test('keeps the DOM contract used by the POS controller and E2E flow', () => {
        const page = fs.readFileSync(path.join(process.cwd(), 'pages/pos.html'), 'utf8');

        expect(page).toContain('id="posActiveShiftContainer"');
        expect(page).toContain('id="posActiveShiftName"');
    });
});
