const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, 'app', 'dashboard', 'page.tsx'), 'utf8');
let line = 1;
let state = null; // null, ', ", `
let escaped = false;
for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  if (ch === '\n') line++;
  if (escaped) { escaped = false; continue; }
  if (ch === '\\') { escaped = true; continue; }
  if (state === null) {
    if (ch === '"' || ch === "'" || ch === '`') state = ch;
  } else if (ch === state) {
    state = null;
  }
}
console.log('Final state:', state);
