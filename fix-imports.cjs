const fs = require('fs');
let content = fs.readFileSync('src/pages/CongViec.jsx', 'utf8');

const importRegex = /import\s+\{[\s\S]*?\}\s+from\s+"..\/utils\/todo";/;
const newImport = `import {
  getTypeIcon,
  getTodoType,
  sortTodos,
  accentTextClass,
  accentSoftClass,
  accentSwatchClass,
  combineTodoTypes,
  isOverdue,
  isDueToday,
  formatDateVN,
  todoTypeBadgeClass,
  todayStr,
  ICON_OPTIONS,
  ACCENT_OPTIONS
} from "../utils/todo";`;

content = content.replace(importRegex, newImport);
fs.writeFileSync('src/pages/CongViec.jsx', content);
