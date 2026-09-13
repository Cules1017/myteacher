import {
  Users,
  ClipboardList,
  BookOpen,
  Award,
  Phone,
  PartyPopper,
  FileText,
  MessageCircle,
  Bell,
  Star,
  Flag,
  Briefcase,
  GraduationCap,
  Heart,
  AlertCircle,
  Wrench,
  Mail,
  Tag,
} from "lucide-react";

export const TODO_TYPES = [
  { key: "hop", label: "Họp", accent: "indigo", icon: "Users" },
  { key: "so-sach", label: "Sổ sách", accent: "amber", icon: "ClipboardList" },
  { key: "giao-an", label: "Soạn giáo án", accent: "emerald", icon: "BookOpen" },
  { key: "cham-diem", label: "Chấm điểm", accent: "sky", icon: "Award" },
  { key: "phu-huynh", label: "Liên hệ phụ huynh", accent: "fuchsia", icon: "Phone" },
  { key: "ngoai-khoa", label: "Hoạt động ngoại khoá", accent: "rose", icon: "PartyPopper" },
  { key: "khac", label: "Khác", accent: "slate", icon: "Tag" },
];

// Curated icon set a user can pick from when creating a custom type.
export const ICON_MAP = {
  Users,
  ClipboardList,
  BookOpen,
  Award,
  Phone,
  PartyPopper,
  FileText,
  MessageCircle,
  Bell,
  Star,
  Flag,
  Briefcase,
  GraduationCap,
  Heart,
  AlertCircle,
  Wrench,
  Mail,
  Tag,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function getTypeIcon(iconKey) {
  return ICON_MAP[iconKey] || Tag;
}

export const ACCENT_OPTIONS = ["indigo", "amber", "emerald", "sky", "fuchsia", "rose", "slate"];

const BADGE_CLASSES = {
  indigo: "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  emerald: "border-primary-400/30 bg-primary-400/10 text-primary-300",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  fuchsia: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
  rose: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  slate: "border-slate-400/30 bg-slate-400/10 text-text-base",
};

const DOT_CLASSES = {
  indigo: "bg-indigo-400",
  amber: "bg-amber-400",
  emerald: "bg-primary-400",
  sky: "bg-sky-400",
  fuchsia: "bg-fuchsia-400",
  rose: "bg-rose-400",
  slate: "bg-slate-400",
};

const SWATCH_CLASSES = {
  indigo: "bg-indigo-400",
  amber: "bg-amber-400",
  emerald: "bg-primary-400",
  sky: "bg-sky-400",
  fuchsia: "bg-fuchsia-400",
  rose: "bg-rose-400",
  slate: "bg-slate-400",
};

export function accentSwatchClass(accent) {
  return SWATCH_CLASSES[accent] || SWATCH_CLASSES.slate;
}

const SWATCH_SOFT_CLASSES = {
  indigo: "bg-indigo-400/20",
  amber: "bg-amber-400/20",
  emerald: "bg-primary-400/20",
  sky: "bg-sky-400/20",
  fuchsia: "bg-fuchsia-400/20",
  rose: "bg-rose-400/20",
  slate: "bg-slate-400/20",
};

export function accentSoftClass(accent) {
  return SWATCH_SOFT_CLASSES[accent] || SWATCH_SOFT_CLASSES.slate;
}

const TEXT_CLASSES = {
  indigo: "text-indigo-300",
  amber: "text-amber-300",
  emerald: "text-primary-300",
  sky: "text-sky-300",
  fuchsia: "text-fuchsia-300",
  rose: "text-rose-300",
  slate: "text-text-base",
};

export function accentTextClass(accent) {
  return TEXT_CLASSES[accent] || TEXT_CLASSES.slate;
}

/** Converts a `loaicongviec` sheet row into the same shape as a built-in TODO_TYPES entry. */
export function toCustomType(row) {
  return {
    key: row.id,
    label: row.ten,
    accent: ACCENT_OPTIONS.includes(row.mauSac) ? row.mauSac : "slate",
    icon: row.icon,
    custom: true,
  };
}

/** Built-in types plus any user-created ones (from the `loaicongviec` table), in display order. */
export function combineTodoTypes(customRows) {
  return [...TODO_TYPES, ...(customRows || []).map(toCustomType)];
}

// `customTypes` may be raw `loaicongviec` rows (id/ten/icon/mauSac) or
// already-converted entries (key/label/accent/icon) — accept both so callers
// can pass straight through whichever shape they have on hand.
export function getTodoType(key, customTypes = []) {
  const builtIn = TODO_TYPES.find((t) => t.key === key);
  if (builtIn) return builtIn;
  const custom = customTypes.find((t) => t.key === key || t.id === key);
  if (custom) return custom.custom ? custom : toCustomType(custom);
  return TODO_TYPES[TODO_TYPES.length - 1];
}

export function todoTypeBadgeClass(key, customTypes = []) {
  return BADGE_CLASSES[getTodoType(key, customTypes).accent];
}

export function todoTypeDotClass(key, customTypes = []) {
  return DOT_CLASSES[getTodoType(key, customTypes).accent];
}

export function todayStr(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function nowHHMM(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function formatDateVN(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/** True when a todo's deadline has passed and it isn't marked done yet. */
export function isOverdue(todo, now = new Date()) {
  if (todo.hoanThanh || !todo.hanNgay) return false;
  const today = todayStr(now);
  if (todo.hanNgay < today) return true;
  if (todo.hanNgay > today) return false;
  return Boolean(todo.hanGio) && todo.hanGio < nowHHMM(now);
}

export function isDueToday(todo, now = new Date()) {
  return todo.hanNgay === todayStr(now);
}

// Undated todos sort to the very end; dated ones ascend by date then time.
export function deadlineSortKey(todo) {
  if (!todo.hanNgay) return "9999-99-99 99:99";
  return `${todo.hanNgay} ${todo.hanGio || "00:00"}`;
}

/** Unfinished todos first (soonest deadline first), then finished ones. */
export function sortTodos(rows) {
  return (rows || [])
    .slice()
    .sort((a, b) => {
      if (Boolean(a.hoanThanh) !== Boolean(b.hoanThanh)) return a.hoanThanh ? 1 : -1;
      return deadlineSortKey(a).localeCompare(deadlineSortKey(b));
    });
}

/** True when deadline is within the next N days (default 3), not done, not already overdue. */
export function isDueSoon(todo, daysAhead = 3, now = new Date()) {
  if (todo.hoanThanh || !todo.hanNgay) return false;
  if (isOverdue(todo, now)) return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(todo.hanNgay);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / 86400000);
  return diffDays >= 0 && diffDays <= daysAhead;
}

export function formatHan(isoDate, isoTime) {
  if (!isoDate) return "";
  const d = formatDateVN(isoDate);
  if (!isoTime) return d;
  return `${d} lúc ${isoTime}`;
}

export function accentBgClass(accent) {
  return accentSoftClass(accent);
}
