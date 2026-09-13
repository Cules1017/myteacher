const utilities = [
  {
    title: "Thư mục giảng dạy",
    description: "Kho tài liệu, giáo án và bài giảng dùng chung trên Google Drive.",
    href: "https://drive.google.com/drive/folders/1GFJ8B4EyilSuHa7julzNALGOHhJJxwLK?usp=sharing",
    icon: (
      <svg viewBox="0 0 87.3 78" className="h-9 w-9">
        <path fill="#0066da" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" />
        <path fill="#00ac47" d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 47.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" />
        <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 47.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l4.7 8.3z" />
        <path fill="#00832d" d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0h-18.5c-1.6 0-3.15.4-4.5 1.2z" />
        <path fill="#2684fc" d="M59.8 52.5H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" />
        <path fill="#ffba00" d="M73.4 26.5L60.6 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.55 25l16.25 27.5H86.1c0-1.55-.4-3.1-1.2-4.5z" />
      </svg>
    ),
    accent: "from-blue-500 to-emerald-400",
  },
];

function UtilityCard({ title, description, href, icon, accent }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/40"
    >
      <div
        className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
        {icon}
      </div>
      <div className="relative flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-300">{description}</p>
      </div>
      <div className="relative mt-auto flex items-center gap-2 text-sm font-medium text-emerald-300">
        Mở liên kết
        <svg
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </a>
  );
}

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16 sm:px-10">
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

        <main className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {utilities.map((u) => (
            <UtilityCard key={u.title} {...u} />
          ))}
        </main>

        <footer className="mt-auto pt-16 text-center text-sm text-slate-500">
          Made with ♥ for My
        </footer>
      </div>
    </div>
  );
}

export default App;
