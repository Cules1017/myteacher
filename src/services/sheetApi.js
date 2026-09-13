const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const TOKEN = import.meta.env.VITE_APPS_SCRIPT_TOKEN;

export function isConfigured() {
  return Boolean(BASE_URL);
}

function assertConfigured() {
  if (!BASE_URL) {
    throw new Error(
      "Chưa cấu hình VITE_APPS_SCRIPT_URL trong file .env — xem apps-script/README.md để thiết lập."
    );
  }
}

export async function listRows(table) {
  assertConfigured();
  const url = `${BASE_URL}?table=${encodeURIComponent(table)}&action=list`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Lỗi không xác định");
  return json.data;
}

async function postAction(table, action, payload) {
  assertConfigured();
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: TOKEN, table, action, ...payload }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Lỗi không xác định");
  return json.data;
}

export const createRow = (table, data) => postAction(table, "create", { data });
export const updateRow = (table, id, data) => postAction(table, "update", { id, data });
export const deleteRow = (table, id) => postAction(table, "delete", { id });

// Creates a brand-new Google Sheet (in the Apps Script owner's Drive) with
// the given headers/rows/cellColors and returns its URL — the "Google
// Sheets" alternative to downloading an .xlsx file. Not table-scoped, so it
// bypasses the RTK Query table cache (see store/sheetApi.js).
export const exportSheet = (payload) => postAction(undefined, "exportSheet", { data: payload });

// Zalo bot config (Bot Token / Gemini API key / webhook secret) — stored in
// Apps Script's PropertiesService, not a Sheet table, so these go through
// dedicated actions rather than the generic table CRUD above.
export const getBotConfig = () => postAction(undefined, "getBotConfig", {});
export const setBotConfig = (data) => postAction(undefined, "setBotConfig", { data });
export const registerZaloWebhook = () => postAction(undefined, "registerZaloWebhook", {});
export const testGeminiKey = () => postAction(undefined, "testGeminiKey", {});
