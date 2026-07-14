const fs = require('fs');
let c = fs.readFileSync('scratch/test_analytics.cjs', 'utf8');
c = c.replace('console.log("Done building analytics!");', 'console.log("current doseItemsSold:", analytics.currentSummary.doseItemsSold);');
eval(c);
