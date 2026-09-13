/**
 * LoadingState — shared loading UI dùng cho tất cả các trang.
 *
 * Props:
 *  - emoji     : string  — emoji theo từng trang (vd: "📚")
 *  - className : string  — tuỳ chỉnh thêm nếu cần
 */
function LoadingState({ emoji = "🥰", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 py-16 ${className}`}>
      {/* Glowing orb + spinning rings */}
      <div className="relative flex items-center justify-center">
        {/* Outer blurred glow */}
        <div className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-primary-400/30 to-blue-500/30 blur-xl" />

        {/* Outer spinning ring */}
        <div className="absolute h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-emerald-400/60 border-r-blue-400/40"
          style={{ animationDuration: "1.8s" }} />

        {/* Inner spinning ring (counter) */}
        <div className="absolute h-11 w-11 animate-spin rounded-full border-2 border-transparent border-b-fuchsia-400/60 border-l-sky-400/40"
          style={{ animationDuration: "1.2s", animationDirection: "reverse" }} />

        {/* Center emoji badge */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-bg-base/80 backdrop-blur-sm ring-1 ring-border">
          <span className="text-lg leading-none">{emoji}</span>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="bg-gradient-to-r from-primary-300 via-slate-100 to-blue-300 bg-clip-text text-base font-semibold text-transparent">
          Đang lấy dữ liệu cho cục iu...
        </p>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary-400/60"
              style={{
                animation: "bounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
