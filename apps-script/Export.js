/**
 * Creates a brand-new Google Sheet (owned by whoever the script executes as —
 * see Deploy > "Execute as" in the README) populated with the given
 * headers/rows, optionally with per-cell background colors, and returns its
 * URL. This is the "Xuất Google Sheets" option in the frontend, an
 * alternative to downloading an .xlsx file. Not tied to any table in
 * Schema.js — the caller sends the exact grid to write.
 */
function exportSheet_(ctx) {
  var data = ctx.data || {};
  var headers = data.headers || [];
  var rows = data.rows || [];
  var cellColors = data.cellColors || [];
  var title = data.title || 'Xuat du lieu';

  var ss = SpreadsheetApp.create(title);
  var sheet = ss.getSheets()[0];
  if (data.sheetName) sheet.setName(data.sheetName);

  var allRows = [headers].concat(rows);
  if (headers.length > 0 && allRows.length > 0) {
    sheet.getRange(1, 1, allRows.length, headers.length).setValues(allRows);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  var colorMap = { red: '#fecaca', green: '#bbf7d0' };
  cellColors.forEach(function (rowColors, r) {
    (rowColors || []).forEach(function (color, c) {
      var bg = colorMap[color];
      if (!bg) return;
      sheet.getRange(r + 2, c + 1).setBackground(bg);
    });
  });

  return { url: ss.getUrl(), id: ss.getId() };
}
