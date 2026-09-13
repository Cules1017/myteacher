/**
 * Route table: mỗi action trỏ tới 1 handler nhỏ nhận `ctx` (đã dựng sẵn
 * `ctx.found = { schema, sheet }` từ `table` trong query/body — xem Router.js).
 * Thêm action mới cho bảng bất kỳ = thêm 1 dòng ở đây, không phải sửa doGet/doPost.
 */
var ROUTES = {
  GET: {
    list: function (ctx) {
      return listRows_(ctx.found.schema, ctx.found.sheet);
    },
  },
  POST: {
    create: function (ctx) {
      return createRow_(ctx.found.schema, ctx.found.sheet, ctx.data);
    },
    update: function (ctx) {
      return updateRow_(ctx.found.schema, ctx.found.sheet, ctx.id, ctx.data);
    },
    delete: function (ctx) {
      return deleteRow_(ctx.found.schema, ctx.found.sheet, ctx.id);
    },
  },
};

/**
 * Web App entry points. Deploy: Deploy > New deployment > Web app.
 * Reads (list) go through doGet (plain cross-origin GET, no CORS preflight).
 * Writes (create/update/delete) go through doPost with a shared-secret token,
 * sent as text/plain from the browser to avoid the JSON preflight CORS issue.
 */
function doGet(e) {
  return handleGet_(ROUTES, e);
}

function doPost(e) {
  return handlePost_(ROUTES, e);
}
