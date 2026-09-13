/**
 * migrate() is idempotent and additive-only:
 * - creates a sheet + header row for any table in SCHEMAS that doesn't exist yet
 * - adds any missing header columns to the end of an existing sheet
 * - never deletes, renames, or reorders existing columns/data
 *
 * Safe to run again any time the schema grows (new column, new table).
 */
function migrate() {
  var results = Object.keys(SCHEMAS).map(function (tableKey) {
    return ensureSheetSchema_(SCHEMAS[tableKey]);
  });
  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

function ensureSheetSchema_(schema) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(schema.sheetName);
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet(schema.sheetName);
    created = true;
  }

  var expectedHeaders = schema.columns.map(function (c) { return c.header; });
  var existingHeaders = headerRowOf_(sheet);
  var addedHeaders = [];

  if (existingHeaders.length === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    addedHeaders = expectedHeaders.slice();
  } else {
    var missing = expectedHeaders.filter(function (h) {
      return existingHeaders.indexOf(h) === -1;
    });
    if (missing.length > 0) {
      sheet.getRange(1, existingHeaders.length + 1, 1, missing.length).setValues([missing]);
      addedHeaders = missing;
    }
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');

  var idHeader = findColumn_(schema, 'id').header;
  var headersNow = headerRowOf_(sheet);
  var idColIndex = headersNow.indexOf(idHeader);
  if (idColIndex !== -1 && !sheet.isColumnHiddenByUser(idColIndex + 1)) {
    sheet.hideColumns(idColIndex + 1);
  }

  return { table: schema.sheetName, created: created, addedHeaders: addedHeaders };
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ My Teacher')
    .addItem('Chạy migrate', 'migrate')
    .addToUi();
}
