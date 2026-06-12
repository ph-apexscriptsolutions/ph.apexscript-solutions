const ts = require('typescript');
const fs = require('fs');
const file = 'app/dashboard/page.tsx';
const source = fs.readFileSync(file, 'utf8');
const result = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.Preserve, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  reportDiagnostics: true,
});
if (result.diagnostics.length === 0) {
  console.log('No diagnostics');
} else {
  result.diagnostics.forEach(d => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    console.log(`${d.file ? d.file.fileName : 'unknown'}:${d.start}:${msg}`);
  });
}
