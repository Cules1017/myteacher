const fs = require('fs');
const content = fs.readFileSync('src/pages/CongViec.jsx', 'utf8');

const regexes = [
  /getTypeIcon/g,
  /getTodoType/g,
  /sortTodos/g,
  /accentTextClass/g,
  /accentBgClass/g,
  /accentSoftClass/g,
  /accentSwatchClass/g,
  /combineTodoTypes/g,
  /isOverdue/g,
  /isDueToday/g,
  /formatHan/g,
  /formatDateVN/g,
  /todoTypeBadgeClass/g,
  /todayStr/g,
  /ICON_OPTIONS/g,
  /ACCENT_OPTIONS/g
];

regexes.forEach(r => {
  const matches = content.match(r);
  if (matches) console.log(`${r.source}: ${matches.length}`);
});
