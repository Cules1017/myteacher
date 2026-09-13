import { NavLink } from "react-router-dom";
import { Home, FolderOpen, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Trang chủ", icon: Home, end: true },
  { to: "/tai-lieu", label: "Tài liệu", icon: FolderOpen },
  { to: "/cai-dat", label: "Cài đặt", icon: Settings },
];

function NavBar() {
  return (
    <nav className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:top-6 sm:bottom-auto">
      <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-2xl backdrop-saturate-150">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium transition-all duration-300 sm:gap-2 sm:px-5 sm:text-sm ${
                isActive
                  ? "bg-white/95 text-slate-900 shadow-md shadow-black/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default NavBar;
