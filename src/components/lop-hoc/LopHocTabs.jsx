import { NavLink } from "react-router-dom";
import { GraduationCap, CalendarCheck, Award, Wallet, CalendarClock } from "lucide-react";

const tabs = [
  { to: "/lop-hoc/hoc-sinh", label: "Học sinh", icon: GraduationCap },
  { to: "/lop-hoc/diem-danh", label: "Điểm danh", icon: CalendarCheck },
  { to: "/lop-hoc/diem", label: "Điểm", icon: Award },
  { to: "/lop-hoc/thoi-khoa-bieu", label: "Thời khoá biểu", icon: CalendarClock },
  { to: "/lop-hoc/quy-thu", label: "Quỹ thu", icon: Wallet },
];

function LopHocTabs() {
  return (
    <nav className="mx-auto flex w-full max-w-xl flex-wrap justify-center gap-1.5 rounded-full border border-border bg-surface p-1.5">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `group relative flex items-center gap-2 rounded-full p-2.5 text-sm font-medium transition-colors sm:px-4 sm:py-1.5 ${
              isActive ? "bg-primary-500 text-white shadow-md" : "text-text-base hover:bg-surface-hover hover:text-text-base"
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          <span className="hidden sm:inline">{label}</span>
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-bg-base px-2.5 py-1 text-xs font-medium text-text-base opacity-0 shadow-lg shadow-black/30 transition-opacity duration-150 group-hover:opacity-100 sm:hidden">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

export default LopHocTabs;
