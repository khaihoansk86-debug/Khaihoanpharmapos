const fs = require('fs');
const path = require('path');

describe('service worker authentication caching', () => {
    const source = fs.readFileSync(
        path.join(process.cwd(), 'sw.js'),
        'utf8'
    );

    test('pre-caches the employee authentication module for offline legacy login', () => {
        expect(source).toContain("'/js/features/auth/employeeAuthenticationService.js'");
    });

    test('never intercepts mutation or API requests', () => {
        expect(source).toContain("event.request.method !== 'GET'");
        expect(source).toContain("requestUrl.pathname.startsWith('/api/')");
    });
});
