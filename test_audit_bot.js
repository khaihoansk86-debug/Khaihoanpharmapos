import { jobRandomAudit } from './bot-assistant/jobs/randomAuditJob.js';

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
