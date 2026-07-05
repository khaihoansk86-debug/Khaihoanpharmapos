const fs = require('fs');

const file = 'js/features/products/productController.js';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `        document.querySelectorAll('#batchRowsContainer .batch-row').forEach((row, index) => {
            const stock = parseFloat(row.querySelector('.batch-stock')?.value) || 0;
            const batchNumber = row.querySelector('.batch-number')?.value.trim() || \`Lô \${index + 1}\`;
            const expiryDate = row.querySelector('.batch-expiry')?.value;
            const batchId = row.dataset.batchId || null;

            if (hasBatch && !expiryDate) {
                throw new Error(\`Vui lòng nhập Hạn sử dụng cho lô hàng "\${batchNumber}"\`);
            }

            if (hasBatch || stock > 0) {
                const item = {
                    batch_number: batchNumber,
                    expiry_date: expiryDate || DEFAULT_FAR_DATE,
                    stock_quantity: stock,
                    is_tracked: hasBatch
                };`;

const newStr = `        document.querySelectorAll('#batchRowsContainer .batch-row').forEach((row, index) => {
            const stock = parseFloat(row.querySelector('.batch-stock')?.value) || 0;
            const batchNumber = row.querySelector('.batch-number')?.value.trim() || \`Lô \${index + 1}\`;
            const expiryDate = row.querySelector('.batch-expiry')?.value;
            const costPrice = parseFloat(row.querySelector('.batch-cost-price')?.value) || 0;
            const batchId = row.dataset.batchId || null;

            if (hasBatch && !expiryDate) {
                throw new Error(\`Vui lòng nhập Hạn sử dụng cho lô hàng "\${batchNumber}"\`);
            }

            if (hasBatch || stock > 0) {
                const item = {
                    batch_number: batchNumber,
                    expiry_date: expiryDate || DEFAULT_FAR_DATE,
                    stock_quantity: stock,
                    cost_price: costPrice,
                    is_tracked: hasBatch
                };`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully updated productController.js');
} else {
    console.log('String not found in productController.js');
}
