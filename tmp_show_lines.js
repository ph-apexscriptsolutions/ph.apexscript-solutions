const fs = require('fs');
const lines = fs.readFileSync('app/dashboard/page.tsx', 'utf8').split(/\r?\n/);
for (let i = 2243; i <= 2246; i++) {
  const line = lines[i-1];
  console.log(`${i}: ${JSON.stringify(line)} (len=${line.length})`);
}
