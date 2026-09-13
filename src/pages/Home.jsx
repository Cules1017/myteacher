import { Link } from "react-router-dom";
import { FolderOpen, Settings, ArrowRight } from "lucide-react";
import GlassCard from "../components/GlassCard";

const shortcuts = [
  {
    to: "/tai-lieu",
    title: "Tài liệu",
    description: "Giáo án, bài giảng và tài nguyên giảng dạy.",
    icon: FolderOpen,
    accent: "from-blue-500 to-emerald-400",
  },
  {
    to: "/cai-dat",
    title: "Cài đặt",
    description: "Tùy chỉnh giao diện và thông tin ứng dụng.",
    icon: Settings,
    accent: "from-fuchsia-500 to-indigo-400",
  },
];

function Home() {
  return (
    <>
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-slate-300">
          Góc công cụ cá nhân
        </span>
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          Tiện ích của My
        </h1>
        <p className="max-w-xl text-base text-slate-400 sm:text-lg">
          Tổng hợp các công cụ và tài nguyên phục vụ công việc giảng dạy, tất cả ở một nơi.
        </p>
      </header>

      <main className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {shortcuts.map(({ to, title, description, icon: Icon, accent }) => (
          <Link key={to} to={to}>
            <GlassCard accent={accent}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="relative flex flex-col gap-1.5">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="text-sm leading-relaxed text-slate-300">{description}</p>
              </div>
              <div className="relative mt-auto flex items-center gap-2 text-sm font-medium text-emerald-300">
                Xem ngay
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.2} />
              </div>
            </GlassCard>
          </Link>
        ))}
      </main>

      <footer className="mt-auto pt-16 text-center text-sm text-slate-500">
        Made with ♥ for My
      </footer>
    </>
  );
}

export default Home;
