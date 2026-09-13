function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOk_(data) {
  return jsonResponse_({ ok: true, data: data });
}

function jsonError_(message) {
  return jsonResponse_({ ok: false, error: message });
}

function checkToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  return !!expected && token === expected;
}

function getSheetForTable_(tableKey) {
  var schema = SCHEMAS[tableKey];
  if (!schema) return null;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(schema.sheetName);
  if (!sheet) return null;
  return { schema: schema, sheet: sheet };
}

function headerRowOf_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function rowToObject_(schema, headers, rowValues, sttPosition) {
  var obj = {};
  schema.columns.forEach(function (col) {
    var idx = headers.indexOf(col.header);
    var value = idx === -1 ? '' : rowValues[idx];
    if (col.type === 'boolean') {
      value = value === true || value === 'TRUE' || value === 'true';
    } else if ((col.type === 'date' || col.type === 'datetime') && value instanceof Date) {
      value = col.type === 'date'
        ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : value.toISOString();
    } else if (col.type === 'time' && value instanceof Date) {
      // Sheets auto-detects an "HH:mm" string written to a cell and silently
      // converts it to a time-of-day Date serial — reformat it back on read
      // so the API keeps returning a plain "HH:mm" string either way.
      value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
    }
    obj[col.key] = value;
  });
  obj.stt = sttPosition;
  return obj;
}

function listRows_(schema, sheet) {
  var headers = headerRowOf_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row, i) {
    return rowToObject_(schema, headers, row, i + 1);
  });
}

function createRow_(schema, sheet, data) {
  var headers = headerRowOf_(sheet);
  var now = new Date();
  var id = Utilities.getUuid();
  var rowValues = headers.map(function (header) {
    var col = findColumnByHeader_(schema, header);
    if (!col) return '';
    if (col.key === 'id') return id;
    if (col.key === 'createdAt' || col.key === 'updatedAt') return now;
    var v = data[col.key];
    if (col.type === 'boolean') return !!v;
    return v === undefined || v === null ? '' : v;
  });
  sheet.appendRow(rowValues);
  return rowToObject_(schema, headers, rowValues, sheet.getLastRow() - 1);
}

function updateRow_(schema, sheet, id, data) {
  var headers = headerRowOf_(sheet);
  var rowIndex = findRowIndexById_(schema, sheet, headers, id);
  if (rowIndex === -1) throw new Error('Không tìm thấy hàng với id: ' + id);

  var currentValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var now = new Date();
  var newValues = headers.map(function (header, i) {
    var col = findColumnByHeader_(schema, header);
    if (!col) return currentValues[i];
    if (col.key === 'id' || col.key === 'createdAt') return currentValues[i];
    if (col.key === 'updatedAt') return now;
    if (Object.prototype.hasOwnProperty.call(data, col.key)) {
      var v = data[col.key];
      return col.type === 'boolean' ? !!v : v;
    }
    return currentValues[i];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([newValues]);
  return rowToObject_(schema, headers, newValues, rowIndex - 1);
}

function deleteRow_(schema, sheet, id) {
  var headers = headerRowOf_(sheet);
  var rowIndex = findRowIndexById_(schema, sheet, headers, id);
  if (rowIndex === -1) throw new Error('Không tìm thấy hàng với id: ' + id);
  sheet.deleteRow(rowIndex);
  return { id: id, deleted: true };
}

function findColumnByHeader_(schema, header) {
  for (var i = 0; i < schema.columns.length; i++) {
    if (schema.columns[i].header === header) return schema.columns[i];
  }
  return null;
}

function findRowIndexById_(schema, sheet, headers, id) {
  var idHeader = findColumn_(schema, 'id').header;
  var idColIndex = headers.indexOf(idHeader);
  if (idColIndex === -1) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}
