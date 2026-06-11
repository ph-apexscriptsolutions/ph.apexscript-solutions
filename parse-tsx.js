const ts = require("typescript");
const fs = require("fs");
const file = fs.readFileSync("app/dashboard/page.tsx", "utf8");
const result = ts.createSourceFile("page.tsx", file, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diagnostics = result.parseDiagnostics;
console.log("errors", diagnostics.length);
diagnostics.forEach(d => {
  console.log(d.start, ts.flattenDiagnosticMessageText(d.messageText, "\n"));
  console.log("snippet:", file.slice(d.start - 20, d.start + 20));
});
