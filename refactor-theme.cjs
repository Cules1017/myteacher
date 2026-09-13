const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /bg-slate-900/g, replacement: 'bg-bg-base' },
  { regex: /bg-slate-950/g, replacement: 'bg-bg-base' },
  { regex: /bg-white\/5/g, replacement: 'bg-surface' },
  { regex: /bg-white\/10/g, replacement: 'bg-surface-hover' },
  { regex: /border-white\/5/g, replacement: 'border-border' },
  { regex: /border-white\/10/g, replacement: 'border-border' },
  { regex: /border-white\/15/g, replacement: 'border-border' },
  { regex: /text-slate-200/g, replacement: 'text-text-base' },
  { regex: /text-slate-300/g, replacement: 'text-text-base' },
  { regex: /text-slate-400/g, replacement: 'text-text-muted' },
  { regex: /text-slate-500/g, replacement: 'text-text-muted' },
  { regex: /text-emerald-/g, replacement: 'text-primary-' },
  { regex: /bg-emerald-/g, replacement: 'bg-primary-' },
  { regex: /border-emerald-/g, replacement: 'border-primary-' },
  { regex: /ring-emerald-/g, replacement: 'ring-primary-' },
  { regex: /from-emerald-/g, replacement: 'from-primary-' },
  { regex: /to-emerald-/g, replacement: 'to-primary-' },
  { regex: /via-emerald-/g, replacement: 'via-primary-' },
  { regex: /from-slate-/g, replacement: 'from-surface-' },
  { regex: /to-slate-/g, replacement: 'to-surface-' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  replacements.forEach(r => {
    content = content.replace(r.regex, r.replacement);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${path.relative(__dirname, file)}`);
  }
});

console.log(`Refactored ${changedFiles} files.`);
