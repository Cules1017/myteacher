import { Fragment, useMemo, useState, useEffect } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, BookOpen, X, Loader2, Eye, EyeOff } from "lucide-react";
import { useGetRowsQuery } from "../store/sheetApi";
import { isConfigured } from "../services/sheetApi";
import LoadingState from "./LoadingState";
import { startOfWeek, addDays, buildTeachingWeeks, getTeachingWeek, findHolidayForDate } from "../utils/schoolYear";
import { isOverdue, isDueToday, isDueSoon, getTypeIcon, getTodoType, accentSoftClass, accentTextClass } from "../utils/todo";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DAY_BY_JS_INDEX = [null, "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKeyLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

function chunkWeeks(days) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
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
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const today = new Date();

  const [showTimetable, setShowTimetable] = useState(() => localStorage.getItem("showTimetableOnCalendar") !== "false");

  useEffect(() => {
    localStorage.setItem("showTimetableOnCalendar", showTimetable);
  }, [showTimetable]);

  const configured = isConfigured();
  const { data: namhocRows, isLoading: namhocLoading } = useGetRowsQuery("namhoc", { skip: !configured });
  const { data: excludedPeriods, isLoading: excludedLoading } = useGetRowsQuery("ngayloaitru", { skip: !configured });
  const { data: todoRows, isLoading: todoLoading } = useGetRowsQuery("congviec", { skip: !configured });
  const { data: customTodoTypes } = useGetRowsQuery("loaicongviec", { skip: !configured });
  const { data: thoikhoabieuRows, isLoading: thoikhoabieuLoading } = useGetRowsQuery("thoikhoabieu", { skip: !configured });
  
  const isLoading = configured && (namhocLoading || excludedLoading || todoLoading || thoikhoabieuLoading);
  
  const namhoc = namhocRows?.[0];

  const schedule = useMemo(() => {
    if (!namhoc?.ngayBatDau || !namhoc?.ngayKetThuc) return [];
    return buildTeachingWeeks({ ...namhoc, excludedPeriods: excludedPeriods || [] });
  }, [namhoc, excludedPeriods]);

  const todosByDate = useMemo(() => {
    const map = new Map();
    (todoRows || [])
      .filter((t) => t.hanNgay)
      .forEach((t) => {
        if (!map.has(t.hanNgay)) map.set(t.hanNgay, []);
        map.get(t.hanNgay).push(t);
      });
    return map;
  }, [todoRows]);

  const goPrev = () => setReferenceDate((d) => (expanded ? addMonths(d, -1) : addDays(d, -7)));
  const goNext = () => setReferenceDate((d) => (expanded ? addMonths(d, 1) : addDays(d, 7)));
  const goToday = () => setReferenceDate(new Date());

  const days = expanded ? getMonthGridDays(referenceDate) : getWeekDays(referenceDate);
  const currentMonth = referenceDate.getMonth();
  const weekRows = expanded ? chunkWeeks(days) : [days];

  const currentWeekLabel = schedule.length > 0 ? getTeachingWeek(referenceDate, schedule)?.label : null;

  // Render DayItems
  const getDayItems = (d) => {
    const holiday = findHolidayForDate(d, excludedPeriods || []);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isFreeDay = holiday || isWeekend;
    let items = [];

    // Tiết dạy
    if (!holiday && showTimetable) {
      const thu = DAY_BY_JS_INDEX[d.getDay()];
      if (thu) {
        const slots = (thoikhoabieuRows || [])
          .filter((r) => r.thu === thu && Boolean(r.cuaToi))
          .sort((a, b) => {
             const b1 = a.buoi === "Sáng" ? 1 : a.buoi === "Chiều" ? 2 : 3;
             const b2 = b.buoi === "Sáng" ? 1 : b.buoi === "Chiều" ? 2 : 3;
             if (b1 !== b2) return b1 - b2;
             return Number(a.tiet) - Number(b.tiet);
          });
        
        slots.forEach(slot => {
          items.push({
            type: 'slot',
            id: `slot-${slot.id}`,
            label: `${slot.monHoc} (T${slot.tiet})`,
            icon: BookOpen,
            bgClass: 'bg-primary-100 dark:bg-primary-400/20',
            textClass: 'text-primary-700 dark:text-primary-300'
          });
        });
      }
    }

    // Công việc
    const dayTodos = todosByDate.get(dayKeyLocal(d)) || [];
    dayTodos.forEach(t => {
       const typeInfo = getTodoType(t.loai, customTodoTypes);
       const Icon = getTypeIcon(typeInfo.icon);
       const overdue = isOverdue(t);
       const dueSoon = isDueSoon(t);
       
       let bgClass = accentSoftClass(typeInfo.accent);
       let textClass = accentTextClass(typeInfo.accent);
       
       if (overdue) {
         bgClass = "bg-rose-100 dark:bg-rose-400/10 ring-1 ring-rose-400/50 dark:ring-rose-400/50";
         textClass = "text-rose-700 dark:text-rose-300";
       } else if (dueSoon) {
         bgClass = "bg-amber-100 dark:bg-amber-400/10 ring-1 ring-amber-400/50 dark:ring-amber-400/50";
         textClass = "text-amber-700 dark:text-amber-300";
       }
       
       items.push({
         type: 'todo',
         id: `todo-${t.id}`,
         label: t.tieuDe,
         icon: Icon,
         bgClass,
         textClass,
         done: Boolean(t.hoanThanh),
         overdue,
       });
    });

    return items;
  };

  const openDayModal = (d) => {
    setSelectedDateForModal(d);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-border bg-surface p-6 backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 opacity-20 blur-2xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-hover ring-1 ring-border">
            <CalendarDays className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-base">Lịch</h2>
              {isLoading && (
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary-400/80"
                      style={{
                        animation: "bounce 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-text-muted">
              {formatLabel(expanded, referenceDate)}
              {!expanded && currentWeekLabel && <span className="text-text-muted"> · {currentWeekLabel}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimetable((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 dark:border-border bg-transparent px-3 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
            title={showTimetable ? "Đang hiện lịch dạy" : "Đã ẩn lịch dạy"}
          >
            {showTimetable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 dark:border-border bg-transparent px-3 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
          >
            {expanded ? "Thu gọn" : "Xem tháng"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              strokeWidth={2.2}
            />
          </button>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <button
          onClick={goPrev}
          aria-label="Trước"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button onClick={goToday} className="text-xs font-medium text-primary-700 dark:text-primary-300 transition-colors hover:text-primary-700 dark:hover:text-primary-200">
          Hôm nay
        </button>
        <button
          onClick={goNext}
          aria-label="Sau"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div key={expanded ? "month" : "week"} className="calendar-fade relative mt-4">
        <div className={`grid gap-y-2 text-center ${schedule.length > 0 && expanded ? "grid-cols-[2.25rem_1fr]" : "grid-cols-1"}`}>
          {schedule.length > 0 && expanded && <span />}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                {w}
              </span>
            ))}
          </div>

          {weekRows.map((weekDays, i) => (
            <Fragment key={i}>
              {schedule.length > 0 && expanded && (
                <span key={`label-${i}`} className="flex items-center justify-center text-[10px] font-medium text-text-muted pt-6">
                  {getTeachingWeek(weekDays[0], schedule)?.weekNumber ?? "—"}
                </span>
              )}
              <div key={`week-${i}`} className="grid grid-cols-7 gap-1">
                {weekDays.map((d) => {
                  const inMonth = !expanded || d.getMonth() === currentMonth;
                  const isToday = isSameDay(d, today);
                  const holiday = findHolidayForDate(d, excludedPeriods || []);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isFreeDay = holiday || isWeekend;
                  const items = getDayItems(d);
                  
                  return (
                    <div key={d.toISOString()} className={`flex flex-col border border-slate-300 dark:border-border rounded-xl p-1.5 transition-colors ${inMonth ? 'bg-slate-50 dark:bg-white/[0.02]' : 'opacity-40'} ${expanded ? 'min-h-[100px]' : 'min-h-[140px]'}`}>
                      <div className="flex justify-center mb-1">
                        <span
                          title={holiday?.tieuDe || undefined}
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors ${
                            isToday
                              ? "bg-gradient-to-br from-primary-400 to-blue-500 font-semibold text-slate-900"
                              : isFreeDay
                                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200 ring-1 ring-blue-300 dark:ring-blue-400/30"
                                : inMonth ? "text-text-base" : "text-text-muted"
                          }`}
                        >
                          {d.getDate()}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 overflow-hidden">
                        {items.slice(0, 3).map(item => {
                           const Icon = item.icon;
                           return (
                             <div key={item.id} className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px] sm:text-xs font-medium truncate ${item.bgClass} ${item.textClass} ${item.done ? 'opacity-50 line-through' : ''}`}>
                               <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
                               <span className="truncate">{item.label}</span>
                             </div>
                           );
                        })}
                        {items.length > 3 && (
                          <button 
                            onClick={() => openDayModal(d)}
                            className="text-[10px] text-text-muted font-medium hover:text-text-base transition-colors mt-0.5 text-left pl-1"
                          >
                            + {items.length - 3} mục khác
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      
      {/* Day Modal */}
      {selectedDateForModal && (
        <DayModal 
           date={selectedDateForModal} 
           items={getDayItems(selectedDateForModal)}
           onClose={() => setSelectedDateForModal(null)} 
        />
      )}
    </div>
  );
}

function DayModal({ date, items, onClose }) {
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-slate-300 dark:border-border bg-bg-base/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-base">Ngày {dateStr}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Không có mục nào</p>
          ) : (
            items.map(item => {
              const Icon = item.icon;
              return (
                 <div key={item.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${item.bgClass} ${item.textClass} ${item.done ? 'opacity-50 line-through' : ''}`}>
                   <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                   <span>{item.label}</span>
                 </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
