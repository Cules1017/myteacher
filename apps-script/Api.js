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
    exportSheet: function (ctx) {
      return exportSheet_(ctx);
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

/**
 * Hàm định kỳ gọi vào Vercel app để tránh bị sleep (Cold start).
 */
function keepVercelAwake() {
  try {
    var response = UrlFetchApp.fetch("https://dmyteacher.vercel.app/", { muteHttpExceptions: true });
    Logger.log("Ping Vercel: " + response.getResponseCode());
  } catch (e) {
    Logger.log("Ping Vercel Error: " + e.message);
  }
}

/**
 * Chạy hàm này (Run) 1 lần duy nhất trong trình soạn thảo Apps Script để thiết lập trigger tự động gọi keepVercelAwake mỗi 1 phút.
 */
function setupVercelPingTrigger() {
  // Xóa các trigger cũ nếu có để tránh trùng lặp
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "keepVercelAwake") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Tạo trigger mới chạy mỗi 1 phút
  ScriptApp.newTrigger("keepVercelAwake")
    .timeBased()
    .everyMinutes(1)
    .create();
    
  Logger.log("Đã cài đặt trigger gọi Vercel mỗi 1 phút thành công!");
}
