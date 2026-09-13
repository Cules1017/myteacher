const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /from-white via-slate-200 to-surface-400/g, replacement: 'from-text-base via-text-muted to-text-base/70' },
  { regex: /from-white via-slate-200 to-slate-400/g, replacement: 'from-text-base via-text-muted to-text-base/70' },
  { regex: /text-slate-900/g, replacement: 'text-bg-base' },
  { regex: /text-slate-800/g, replacement: 'text-bg-base' },
  { regex: /text-white/g, replacement: 'text-text-base' }
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

  // We only replace text-white with text-text-base if it's NOT inside a button that has a primary background
  // To be safe, we will just manually fix Settings.jsx inputs first, but let's replace headers globally.
  
  const headerReplacements = replacements.slice(0, 2);
  headerReplacements.forEach(r => {
    content = content.replace(r.regex, r.replacement);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${path.relative(__dirname, file)}`);
  }
});

console.log(`Refactored ${changedFiles} files.`);
