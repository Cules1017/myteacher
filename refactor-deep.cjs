const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Fix borders and rings
  { regex: /border-white\/(5|10|15|20|25)/g, replacement: 'border-border' },
  { regex: /ring-white\/(5|10|15|20|25)/g, replacement: 'ring-border' },
  { regex: /hover:border-white\/(20|25|30)/g, replacement: 'hover:border-border' },
  { regex: /hover:bg-white\/(5|10)/g, replacement: 'hover:bg-surface-hover' },
  { regex: /bg-white\/(5|10)/g, replacement: 'bg-surface' },
  
  // Fix inputs that blend into cards by replacing bg-surface with bg-black/5 (light) and bg-white/5 (dark)
  // Actually, let's define a new CSS variable for input backgrounds in index.css.
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
  
  // Custom fix for inputs in Settings.jsx and others:
  // If an input has bg-surface, let's change it to bg-surface-hover to contrast with the card
  content = content.replace(/<input([^>]*?)bg-surface([^>]*?)>/g, '<input$1bg-surface-hover$2>');
  content = content.replace(/<textarea([^>]*?)bg-surface([^>]*?)>/g, '<textarea$1bg-surface-hover$2>');

  // Also text-white inside inputs might still be there in other files
  content = content.replace(/<input([^>]*?)text-white([^>]*?)>/g, '<input$1text-text-base$2>');
  
  // In Settings.jsx, we want the GlassCard title to be text-text-base
  content = content.replace(/text-white/g, 'text-text-base');
  
  // Restore text-white for buttons with solid primary background (very simple heuristic)
  content = content.replace(/bg-primary-500([^>]*?)text-text-base/g, 'bg-primary-500$1text-white');
  content = content.replace(/bg-rose-500([^>]*?)text-text-base/g, 'bg-rose-500$1text-white');
  content = content.replace(/bg-blue-500([^>]*?)text-text-base/g, 'bg-blue-500$1text-white');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${path.relative(__dirname, file)}`);
  }
});

console.log(`Refactored ${changedFiles} files.`);
