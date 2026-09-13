const fs = require('fs');
let index = fs.readFileSync('src/main.jsx', 'utf8');

if (!index.includes('window.onerror')) {
  const patch = `
window.onerror = function(message, source, lineno, colno, error) {
  fetch('/log-error', { method: 'POST', body: error ? error.stack : message });
};
const originalConsoleError = console.error;
console.error = function(...args) {
  fetch('/log-error', { method: 'POST', body: args.map(a => a && a.stack ? a.stack : String(a)).join('\\n') });
  originalConsoleError.apply(console, args);
};
`;
  index = index.replace(/import.*?['"];?/, match => match + '\n' + patch);
  fs.writeFileSync('src/main.jsx', index);
}
