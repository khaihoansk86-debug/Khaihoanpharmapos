import os

test_file = r'd:\Khaihoanpharmapos\test_zalo_bot.js'
content = """import { jobStocktakeReport } from './bot-assistant/jobs/stocktakeReportJob.js';

const config = {
    report_receivers: ['lê đoàn khanh']
};

console.log('Running test stocktake report...');
jobStocktakeReport(config).then(() => {
    console.log('Test completed.');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
"""

with open(test_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Test script created. Ready to run node test_zalo_bot.js")
