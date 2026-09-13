/**
 * Generic GET/POST dispatcher shared by every route table (see Api.js).
 * Resolves `table` -> { schema, sheet } once, checks the token for POST,
 * then calls the matching handler with a small `ctx` object.
 */
function handleGet_(routes, e) {
  var action = (e && e.parameter && e.parameter.action) || 'list';
  return dispatch_(routes.GET, action, buildGetContext_(e));
}

function handlePost_(routes, e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonError_('Body không hợp lệ (không phải JSON)');
  }
  if (!checkToken_(body.token)) return jsonError_('Không có quyền truy cập');
  return dispatch_(routes.POST, body.action, buildPostContext_(body));
}

function dispatch_(routesForMethod, action, ctx) {
  try {
    if (ctx.table && !ctx.found) {
      return jsonError_('Bảng không tồn tại: ' + ctx.table);
    }
    var handler = routesForMethod && routesForMethod[action];
    if (!handler) return jsonError_('Route không tồn tại: ' + action);
    return jsonOk_(handler(ctx));
  } catch (err) {
    return jsonError_(String(err));
  }
}

function buildGetContext_(e) {
  var table = e && e.parameter && e.parameter.table;
  return { table: table, found: getSheetForTable_(table), params: (e && e.parameter) || {} };
}

function buildPostContext_(body) {
  var table = body.table;
  return {
    table: table,
    found: getSheetForTable_(table),
    id: body.id,
    data: body.data || {},
    body: body,
  };
}
