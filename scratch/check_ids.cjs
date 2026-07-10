const fs = require('fs');
const html = fs.readFileSync('pages/receive.html', 'utf8');
const js = fs.readFileSync('js/features/receive/receiveController.js', 'utf8');

const idRegex = /getElementById\(['"`](.*?)['"`]\)/g;
let match;
const missingIds = [];

while ((match = idRegex.exec(js)) !== null) {
  const id = match[1];
  if (!html.includes('id=\"' + id + '\"') && !html.includes("id='" + id + "'")) {
    missingIds.push(id);
  }
}

console.log('Missing IDs:', missingIds);
