function GlassCard({ children, accent = "from-blue-500 to-emerald-400", className = "" }) {
  return (
    <div
      className={`group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/40 ${className}`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`}
      />
      {children}
    </div>
  );
}

export default GlassCard;
