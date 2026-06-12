const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app', 'dashboard', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
const start = 2288;
const end = 2310;
for (let i = start; i < end && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
