const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app', 'dashboard', 'page.tsx');
const source = fs.readFileSync(file, 'utf8');
const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
if (sf.parseDiagnostics.length === 0) {
  console.log('No parse diagnostics');
  process.exit(0);
}
const lines = source.split(/\r?\n/);
for (const diag of sf.parseDiagnostics) {
  const { line, character } = sf.getLineAndCharacterOfPosition(diag.start);
  console.log(`${file}:${line+1}:${character+1}: ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`);
  console.log(`  ${lines[line]}`);
}
