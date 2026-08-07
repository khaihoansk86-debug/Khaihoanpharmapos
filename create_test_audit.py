import os

test_file = r'd:\Khaihoanpharmapos\test_audit_bot.js'
content = """import { jobRandomAudit } from './bot-assistant/jobs/randomAuditJob.js';

const config = {
    staff_list: ['lê đoàn khanh']
};

console.log('Running test random audit...');
jobRandomAudit(config).then(() => {
    console.log('Test completed.');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
"""

with open(test_file, 'w', encoding='utf-8') as f:
    f.write(content)
