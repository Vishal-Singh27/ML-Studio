const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('client/src/App.tsx', 'utf-8');
const sf = ts.createSourceFile('client/src/App.tsx', code, ts.ScriptTarget.Latest, true);
let errors = sf.parseDiagnostics;
if (errors.length > 0) {
  errors.forEach(e => {
    let { line, character } = sf.getLineAndCharacterOfPosition(e.start);
    console.log(`Error at line ${line + 1}, char ${character + 1}: ${e.messageText}`);
  });
} else {
  console.log('No parse errors.');
}
