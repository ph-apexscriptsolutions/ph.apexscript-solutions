const fs = require('fs');
const p = 'app/dashboard/page.tsx';
const code = fs.readFileSync(p, 'utf8');
let line = 1;
let stack = [];
const opens = { '{': '}', '(': ')', '[': ']' };
const closes = { '}': '{', ')': '(', ']': '[' };
for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  if (ch === '\n') line++;
  if (ch === '{' || ch === '(' || ch === '[') stack.push({ ch, i, line });
  if (ch === '}' || ch === ')' || ch === ']') {
    const top = stack.pop();
    if (!top || top.ch !== closes[ch]) {
      console.log('Mismatch at line', line, 'char', i, 'found', ch, 'expected', top ? opens[top.ch] : 'none');
      process.exit(1);
    }
  }
}
if (stack.length) {
  console.log('Unclosed at end:', stack.slice(-5).map(s => `${s.ch}@${s.line}`).join(', '));
} else {
  console.log('Brackets balanced.');
}
