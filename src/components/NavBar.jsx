import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, FolderOpen, Users, ListTodo, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Trang chủ", icon: Home, end: true },
  { to: "/tai-lieu", label: "Tài liệu", icon: FolderOpen },
  { to: "/lop-hoc", label: "Lớp học", icon: Users },
  { to: "/cong-viec", label: "Việc cần làm", icon: ListTodo },
  { to: "/cai-dat", label: "Cài đặt", icon: Settings },
];

function NavBar() {
  const location = useLocation();
  const itemRefs = useRef([]);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const activeIndex = items.findIndex((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const measure = () => {
    const el = itemRefs.current[activeIndex];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  };

  useLayoutEffect(measure, [activeIndex]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex]);

  return (
    <nav className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:top-6 sm:bottom-auto">
      <div className="relative flex items-center gap-1 rounded-full border border-border bg-surface-hover p-1.5 shadow-2xl shadow-black/40 backdrop-blur-2xl backdrop-saturate-150">
        <span
          className="liquid-pill pointer-events-none absolute inset-y-1.5 rounded-full"
          style={{
            left: pill.left,
            width: pill.width,
            opacity: pill.ready ? 1 : 0,
          }}
        />
        {items.map(({ to, label, icon: Icon, end }, i) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={({ isActive }) =>
              `group relative z-10 flex items-center gap-2 rounded-full p-2.5 text-sm font-medium transition-colors duration-300 sm:px-5 sm:py-2.5 ${
                isActive ? "text-slate-900" : "text-text-base hover:text-text-base"
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
      </div>
    </nav>
  );
}

export default NavBar;
