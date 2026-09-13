export function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function parseISODate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the excluded period (from `ngayloaitru` rows) that covers `date`,
 * or null. A period covers a day when tuNgay <= day <= denNgay (inclusive).
 */
export function findHolidayForDate(date, excludedPeriods) {
  const key = dayKey(date);
  for (const period of excludedPeriods || []) {
    const from = parseISODate(period.tuNgay);
    const to = parseISODate(period.denNgay) || from;
    if (!from) continue;
    if (key >= dayKey(from) && key <= dayKey(to)) return period;
  }
  return null;
}

/**
 * Builds the list of teaching weeks from `startDate` to `endDate` (both
 * `namhoc` fields, ISO strings). A week that is *entirely* covered by one or
 * more excluded periods gets no sequential number — its label is the
 * excluded period's title instead — and the running week count simply never
 * advances for that week, so the next real teaching week continues the
 * sequence without a gap or a repeat. A week with only a day or two excluded
 * still counts normally.
 */
export function buildTeachingWeeks({ ngayBatDau, ngayKetThuc, excludedPeriods = [] }) {
  const start = parseISODate(ngayBatDau);
  const end = parseISODate(ngayKetThuc);
  if (!start || !end) return [];

  const weeks = [];
  let weekNumber = 0;
  for (let cursor = startOfWeek(start); cursor <= end; cursor = addDays(cursor, 7)) {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
    const holidays = weekDays.map((d) => findHolidayForDate(d, excludedPeriods));
    const fullyExcluded = holidays.every(Boolean);

    if (fullyExcluded) {
      // Prefer the title covering the week's Monday; fall back to the first day's.
      const title = holidays[0]?.tieuDe || "Nghỉ";
      weeks.push({ weekStart: cursor, label: title, weekNumber: null });
    } else {
      weekNumber += 1;
      weeks.push({ weekStart: cursor, label: `Tuần ${weekNumber}`, weekNumber });
    }
  }
  return weeks;
}

/** Finds the teaching-week entry (from buildTeachingWeeks) covering `date`. */
export function getTeachingWeek(date, schedule) {
  const key = dayKey(startOfWeek(date));
  return schedule.find((w) => dayKey(w.weekStart) === key) || null;
}
