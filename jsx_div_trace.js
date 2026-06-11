const fs = require('fs');
const lines = fs.readFileSync('app/dashboard/page.tsx','utf8').split(/\r?\n/);
const snippet = lines.slice(942,1275).join('\n');
let i = 0, line = 943;
const stack = [];
while (i < snippet.length) {
  const c = snippet[i];
  if (c === '\n') { line++; i++; continue; }
  if (c === '<') {
    const next = snippet[i+1];
    if (next === '!' || next === '?') {
      const end = snippet.indexOf('>', i);
      if (end === -1) break;
      i = end + 1;
      continue;
    }
    const closing = next === '/';
    let j = i + 1 + (closing ? 1 : 0);
    while (j < snippet.length && !/[\s>\/]/.test(snippet[j])) j++;
    const tag = snippet.slice(i + 1 + (closing ? 1 : 0), j);
    const end = snippet.indexOf('>', i);
    if (end === -1) break;
    if (tag === 'div') {
      if (closing) {
        const last = stack.pop();
        console.log(`${line}: closing div, pop ${last ? last.line : 'none'}, stack now ${stack.map(x => x.line).join(',')}`);
      } else {
        stack.push({ line, text: snippet.slice(i, end+1) });
        console.log(`${line}: opening div, push stack ${stack.map(x => x.line).join(',')}`);
      }
    }
    i = end + 1;
    continue;
  }
  i++;
}
console.log('FINAL stack', stack.map(x=>x.line));
