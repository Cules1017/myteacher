import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/lop-hoc/hoc-sinh", label: "Học sinh" },
  { to: "/lop-hoc/diem-danh", label: "Điểm danh" },
  { to: "/lop-hoc/diem", label: "Điểm" },
  { to: "/lop-hoc/quy-thu", label: "Quỹ thu" },
];

function LopHocTabs() {
  return (
    <nav className="mx-auto flex w-full max-w-xl flex-wrap justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "bg-white/90 text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default LopHocTabs;
