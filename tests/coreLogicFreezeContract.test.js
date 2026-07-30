const crypto = require('crypto');
const fs = require('fs');

const FROZEN_MODULE_HASHES = Object.freeze({
    'js/features/reports/reportAnalyticsRules.js': 'fb3b4299c1d0884f02f3ce3e0025fa428f334bf603bad1a007e1374c641f11e4',
    'js/features/pos/orderService.js': 'f24d50ee5341b3bc7855d173ad9d6b47e80207453e863990490dd7756ab93219',
    'js/features/pos/orderRules.js': '9af13e4a6a32177f45cc657128d3145b042e1741ac31850703d81c31778d78fa',
    'js/features/pos/inventoryIssueRules.js': '6c59d2cc6c4082196fa28f6620b27b9468ec473df7159f3092bca247fad4652a',
    'js/features/pos/shiftAmountRules.js': 'c5ce514f734804c2a34fc01eebfe07ee2ee87de61e0be3597c2485c3e6d2d1ab',
    'js/features/pos/shiftSelection.js': 'd58c95ed63f74a604ab6a0209d25962909bde59b951efa6abdcfc2f144fd7df5',
    'js/features/pos/shiftSyncService.js': '5923936cfbddd923cbbec6e49aa8dd122df4bd76fb19ad948325771e784d53d8',
    'js/features/inventory/inventoryService.js': '6d6338e18d86674260da01ec78d1d1f4b09a041011999714d04866a3c3918722',
    'js/features/products/productService.js': '0adcbf9a432843a8acaf455571104a4c5c13bb988003b7811d56049634820815',
    'js/features/reports/reportService.js': 'f2340af481215208a717b91a1e811522ba883723b5c41d650720575ca8569098',
    'js/features/reports/doseReportRules.js': 'ef46c3a6bbfbf063e6b29997662711ba9c33d8e8935667936f52850cdc50b2a8',
    'js/features/reports/overviewShiftService.js': '2d64b512bca2b56438ab0f6fa1bda00d6198b953b96a255692346e82bbda1322'
});

function normalizedFileHash(filePath) {
    const source = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(source).digest('hex');
}

describe('core logic freeze contract', () => {
    test.each(Object.entries(FROZEN_MODULE_HASHES))(
        'keeps %s unchanged unless the core contract is explicitly reviewed',
        (filePath, expectedHash) => {
            expect(normalizedFileHash(filePath)).toBe(expectedHash);
        }
    );
});
