const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app', 'dashboard', 'page.tsx');
const source = fs.readFileSync(file, 'utf8');
const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = ts.getPreEmitDiagnostics(sf);
if (diagnostics.length === 0) {
  console.log('No diagnostics');
  process.exit(0);
}
for (const d of diagnostics) {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (!d.start) {
    console.log(`Diagnostic: ${msg}`);
    continue;
  }
  const { line, character } = sf.getLineAndCharacterOfPosition(d.start);
  const lineText = source.split(/\r?\n/)[line];
  console.log(`${file}:${line+1}:${character+1}: ${msg}`);
  console.log(`  ${lineText}`);
}
