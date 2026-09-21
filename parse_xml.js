const fs = require('fs');
const babel = require('/tmp/node_modules/@babel/parser');
let code = fs.readFileSync('client/src/App.tsx', 'utf-8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("No syntax errors found by Babel.");
} catch(e) {
  console.log(`Babel Error: ${e.message} at line ${e.loc.line}, col ${e.loc.column}`);
  // Let's print the line and surrounding lines
  const lines = code.split('\n');
  const start = Math.max(0, e.loc.line - 5);
  const end = Math.min(lines.length - 1, e.loc.line + 5);
  for (let i = start; i <= end; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
