import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function getMonthGridDays(date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(startOfWeek(monthEnd), 6);
  const days = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

function formatLabel(expanded, referenceDate) {
  if (expanded) {
    return `Tháng ${referenceDate.getMonth() + 1}, ${referenceDate.getFullYear()}`;
  }
  const [start, end] = [startOfWeek(referenceDate), addDays(startOfWeek(referenceDate), 6)];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} thg ${end.getMonth() + 1}, ${end.getFullYear()}`;
  }
  return `${start.getDate()} thg ${start.getMonth() + 1} - ${end.getDate()} thg ${end.getMonth() + 1}, ${end.getFullYear()}`;
}

function Calendar() {
  const [expanded, setExpanded] = useState(false);
  const [referenceDate, setReferenceDate] = useState(new Date());
  const today = new Date();

  const goPrev = () => setReferenceDate((d) => (expanded ? addMonths(d, -1) : addDays(d, -7)));
  const goNext = () => setReferenceDate((d) => (expanded ? addMonths(d, 1) : addDays(d, 7)));
  const goToday = () => setReferenceDate(new Date());

  const days = expanded ? getMonthGridDays(referenceDate) : getWeekDays(referenceDate);
  const currentMonth = referenceDate.getMonth();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 opacity-20 blur-2xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <CalendarDays className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Lịch</h2>
            <p className="text-xs text-slate-400">{formatLabel(expanded, referenceDate)}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {expanded ? "Thu gọn" : "Xem tháng"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            strokeWidth={2.2}
          />
        </button>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <button
          onClick={goPrev}
          aria-label="Trước"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button onClick={goToday} className="text-xs font-medium text-emerald-300 transition-colors hover:text-emerald-200">
          Hôm nay
        </button>
        <button
          onClick={goNext}
          aria-label="Sau"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div key={expanded ? "month" : "week"} className="calendar-fade relative mt-4 grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {w}
          </span>
        ))}
        {days.map((d) => {
          const inMonth = !expanded || d.getMonth() === currentMonth;
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className="flex items-center justify-center py-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                  isToday
                    ? "bg-gradient-to-br from-emerald-400 to-blue-500 font-semibold text-slate-900"
                    : inMonth
                      ? "text-slate-200"
                      : "text-slate-600"
                }`}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
