import { normalizeText } from "./text";

export const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
export const SESSIONS = ["Sáng", "Chiều"];
export const DEFAULT_PERIODS_BY_SESSION = { Sáng: [1, 2, 3, 4, 5], Chiều: [1, 2, 3] };

const DAY_BY_JS_INDEX = [null, "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export function slotKey(thu, buoi, tiet) {
  return `${thu}__${buoi}__${tiet}`;
}

/** Maps JS Date#getDay() (0=Sun..6=Sat) to a DAYS label, or null for Sunday. */
export function getTodayThu(now = new Date()) {
  return DAY_BY_JS_INDEX[now.getDay()] || null;
}

/** Groups khunggio rows by buổi, sorted by tiết ascending. Falls back to a default range when a buổi has no configured rows yet. */
export function groupPeriodsBySession(khungGioRows) {
  const result = {};
  SESSIONS.forEach((buoi) => {
    const rows = (khungGioRows || [])
      .filter((r) => r.buoi === buoi)
      .slice()
      .sort((a, b) => Number(a.tiet) - Number(b.tiet));
    result[buoi] = rows.length > 0 ? rows : DEFAULT_PERIODS_BY_SESSION[buoi].map((tiet) => ({ tiet }));
  });
  return result;
}

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Finds the {buoi, tiet, row} whose [gioBatDau, gioKetThuc] window contains `now`. */
export function getCurrentPeriod(khungGioRows, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const row of khungGioRows || []) {
    const start = toMinutes(row.gioBatDau);
    const end = toMinutes(row.gioKetThuc);
    if (start == null || end == null) continue;
    if (nowMinutes >= start && nowMinutes <= end) {
      return { buoi: row.buoi, tiet: Number(row.tiet), row };
    }
  }
  return null;
}

/**
 * Resolves the monHocId that's currently being taught right now, per the
 * timetable + period-time config. Falls back to matching thoikhoabieu's
 * denormalized subject name against monhoc.tenMon when monHocId isn't set
 * on the slot (e.g. slots created before subjects were linked).
 */
export function getCurrentMonHocId({ thoikhoabieuRows, khungGioRows, monhocRows, now = new Date() }) {
  const thu = getTodayThu(now);
  if (!thu) return null;

  const period = getCurrentPeriod(khungGioRows, now);
  if (!period) return null;

  const slot = (thoikhoabieuRows || []).find(
    (r) => r.thu === thu && r.buoi === period.buoi && Number(r.tiet) === period.tiet
  );
  if (!slot) return null;

  if (slot.monHocId) return slot.monHocId;

  if (slot.monHoc) {
    const match = (monhocRows || []).find((m) => normalizeText(m.tenMon) === normalizeText(slot.monHoc));
    if (match) return match.id;
  }
  return null;
}
