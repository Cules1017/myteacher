import GlassCard from "../components/GlassCard";
import { isConfigured } from "../services/sheetApi";
import { useGetRowsQuery } from "../store/sheetApi";
import LoadingState from "../components/LoadingState";

// Hardcoded array for fallback when not configured or empty
const fallbackDocuments = [
  {
    tieuDe: "Thư mục giảng dạy",
    moTa: "Kho tài liệu, giáo án và bài giảng dùng chung trên Google Drive.",
    lienKet: "https://drive.google.com/drive/folders/1GFJ8B4EyilSuHa7julzNALGOHhJJxwLK?usp=sharing",
  },
];

const ACCENTS = [
  "from-blue-500 to-emerald-400",
  "from-violet-500 to-fuchsia-400",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-indigo-500",
  "from-rose-400 to-pink-500",
];

const DEFAULT_ICON = (
  <svg viewBox="0 0 87.3 78" className="h-9 w-9">
    <path fill="#0066da" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" />
    <path fill="#00ac47" d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 47.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" />
    <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 47.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l4.7 8.3z" />
    <path fill="#00832d" d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0h-18.5c-1.6 0-3.15.4-4.5 1.2z" />
    <path fill="#2684fc" d="M59.8 52.5H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" />
    <path fill="#ffba00" d="M73.4 26.5L60.6 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.55 25l16.25 27.5H86.1c0-1.55-.4-3.1-1.2-4.5z" />
  </svg>
);

function Documents() {
  const configured = isConfigured();
  const { data: rows, isLoading, error } = useGetRowsQuery("tailieu", { skip: !configured });

  const displayDocs = (configured && rows && rows.length > 0) ? rows : fallbackDocuments;

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border bg-surface px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Tài liệu
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Tài liệu giảng dạy
        </h1>
        <p className="max-w-xl text-base text-text-muted sm:text-lg">
          Các thư mục và tài nguyên phục vụ công việc giảng dạy.
        </p>
      </header>

      <main className="mt-12">
        {isLoading ? (
          <LoadingState emoji="📁" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayDocs.map((doc, idx) => (
              <a key={doc.id || doc.tieuDe} href={doc.lienKet} target="_blank" rel="noreferrer">
                <GlassCard accent={ACCENTS[idx % ACCENTS.length]}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface ring-1 ring-border">
                    {DEFAULT_ICON}
                  </div>
                  <div className="relative flex flex-col gap-1.5">
                    <h2 className="text-xl font-semibold text-text-base">{doc.tieuDe}</h2>
                    <p className="text-sm leading-relaxed text-text-muted">{doc.moTa}</p>
                  </div>
                  <div className="relative mt-auto flex items-center gap-2 text-sm font-medium text-emerald-500 dark:text-emerald-300">
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
                </GlassCard>
              </a>
            ))}
          </div>
        )}
        
        {error && (
           <div className="mt-8 mx-auto max-w-md rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-center text-sm text-rose-200">
             Lỗi tải danh sách tài liệu: {error.message}
           </div>
        )}
      </main>
    </>
  );
}

export default Documents;
