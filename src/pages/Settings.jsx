import { Moon, Info, Sparkles } from "lucide-react";
import GlassCard from "../components/GlassCard";

function Settings() {
  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-slate-300">
          Cài đặt
        </span>
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Tùy chỉnh
        </h1>
        <p className="max-w-xl text-base text-slate-400 sm:text-lg">
          Một vài thông tin và tùy chọn của ứng dụng.
        </p>
      </header>

      <main className="mt-12 flex flex-col gap-4">
        <GlassCard accent="from-indigo-500 to-fuchsia-400" className="flex-row items-center gap-5 hover:-translate-y-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Moon className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="relative flex flex-1 flex-col gap-0.5">
            <h2 className="font-semibold text-white">Giao diện</h2>
            <p className="text-sm text-slate-300">Nền tối (mặc định)</p>
          </div>
          <span className="relative rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Đang bật
          </span>
        </GlassCard>

        <GlassCard accent="from-blue-500 to-emerald-400" className="flex-row items-center gap-5 hover:-translate-y-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Info className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="relative flex flex-1 flex-col gap-0.5">
            <h2 className="font-semibold text-white">Phiên bản</h2>
            <p className="text-sm text-slate-300">Tiện ích của My — v1.0.0</p>
          </div>
        </GlassCard>

        <GlassCard accent="from-amber-400 to-rose-400" className="flex-row items-center gap-5 hover:-translate-y-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="relative flex flex-1 flex-col gap-0.5">
            <h2 className="font-semibold text-white">Sắp ra mắt</h2>
            <p className="text-sm text-slate-300">Thêm tùy chọn cá nhân hóa sẽ xuất hiện tại đây.</p>
          </div>
        </GlassCard>
      </main>
    </>
  );
}

export default Settings;
