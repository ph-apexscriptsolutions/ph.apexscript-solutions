const fs = require('fs');
const ts = require('typescript');
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
parsed.options.incremental = false;
parsed.options.tsBuildInfoFile = undefined;
const program = ts.createProgram(['app/dashboard/page.tsx'], parsed.options);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length === 0) {
  console.log('ok');
} else {
  diagnostics.forEach(d => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file) {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      console.log(`${d.file.fileName}:${line+1}:${character+1} - ${msg}`);
    } else {
      console.log(msg);
    }
  });
  process.exit(1);
}
