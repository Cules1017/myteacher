/**
 * Web App entry points. Deploy: Deploy > New deployment > Web app.
 * Reads (list) go through doGet (plain cross-origin GET, no CORS preflight).
 * Writes (create/update/delete) go through doPost with a shared-secret token,
 * sent as text/plain from the browser to avoid the JSON preflight CORS issue.
 */
function doGet(e) {
  try {
    var table = e.parameter.table;
    var action = e.parameter.action || 'list';
    var found = getSheetForTable_(table);
    if (!found) return jsonError_('Bảng không tồn tại: ' + table);

    if (action === 'list') {
      return jsonOk_(listRows_(found.schema, found.sheet));
    }
    return jsonError_('Action không hợp lệ: ' + action);
  } catch (err) {
    return jsonError_(String(err));
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!checkToken_(body.token)) return jsonError_('Không có quyền truy cập');

    var found = getSheetForTable_(body.table);
    if (!found) return jsonError_('Bảng không tồn tại: ' + body.table);

    var schema = found.schema;
    var sheet = found.sheet;

    if (body.action === 'create') return jsonOk_(createRow_(schema, sheet, body.data || {}));
    if (body.action === 'update') return jsonOk_(updateRow_(schema, sheet, body.id, body.data || {}));
    if (body.action === 'delete') return jsonOk_(deleteRow_(schema, sheet, body.id));
    return jsonError_('Action không hợp lệ: ' + body.action);
  } catch (err) {
    return jsonError_(String(err));
  }
}
