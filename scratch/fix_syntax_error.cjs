const fs = require('fs');
let content = fs.readFileSync('js/features/customers/customerService.js', 'utf8');
const lines = content.split('\n');
const startIdx = 293;
const endIdx = 309;

console.log("Lines to replace:");
console.log(lines.slice(startIdx, endIdx + 1).join('\n'));

const cleanReplacement = [
  "        const prefix = 'PT-TN';",
  "        const rand = Math.floor(1000 + Math.random() * 9000);",
  "        const txCode = prefix + '-' + order.order_code + '-' + rand;",
  "",
  "        transactions.push({",
  "            transaction_code: txCode,",
  "            type: 'income',",
  "            amount: applyAmt,",
  "            category: 'Thu nợ khách hàng',",
  "            ref_type: 'sales',",
  "            ref_id: order.id,",
  "            payment_method: paymentMethod,",
  "            performer: performer,",
  "            description: 'Thu nợ (Thanh toán gộp KH ' + customerName + ') cho hóa đơn ' + order.order_code + '. Số tiền: ' + applyAmt,",
  "            status: 'completed',",
  "            transaction_date: new Date().toISOString()",
  "        });"
].join('\n');

lines.splice(startIdx, endIdx - startIdx + 1, cleanReplacement);
fs.writeFileSync('js/features/customers/customerService.js', lines.join('\n'), 'utf8');
console.log("Replacement done!");
