const fs = require('fs');
const path = require('path');

describe('product stock-limit filter wiring', () => {
    test('imports the classifier used by the stock filter', () => {
        const controller = fs.readFileSync(
            path.join(process.cwd(), 'js/features/products/productController.js'),
            'utf8'
        );
        expect(controller).toMatch(
            /import\s*\{[\s\S]*classifyStockAgainstLimits[\s\S]*\}\s*from ['"]\.\/productStockLimitRules\.js['"]/m
        );
        expect(controller).toContain('classifyStockAgainstLimits(itemStock');
    });
});
