const PHAN_LOAI = [
  { key: "tich-cuc", label: "Tích cực", emoji: "✅", color: "bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30" },
  { key: "trung-lap", label: "Trung lập", emoji: "📝", color: "bg-slate-100 dark:bg-slate-400/10 text-text-muted border-slate-200 dark:border-slate-400/20" },
  { key: "tieu-cuc", label: "Tiêu cực", emoji: "❌", color: "bg-rose-100 dark:bg-rose-400/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-400/30" },
];

function QuickNhanXetModal({ student, onClose, createRow }) {
  const [noiDung, setNoiDung] = useState("");
  const [phanLoai, setPhanLoai] = useState("tich-cuc");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!noiDung.trim()) return;
    setSaving(true);
    try {
      await createRow({
        table: "nhanxet",
        data: { hocSinhId: student.id, noiDung: noiDung.trim(), phanLoai }
      }).unwrap();
      onClose();
    } catch (e) {
      alert("Lỗi khi lưu: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg-base/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-base">Nhận xét nhanh</h2>
            <p className="text-sm text-text-muted">{student.hoVaTen}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            {PHAN_LOAI.map((pl) => (
              <button
                key={pl.key}
                type="button"
                onClick={() => setPhanLoai(pl.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  phanLoai === pl.key
                    ? pl.color + " scale-105 shadow-sm"
                    : "border-border text-text-muted hover:bg-surface-hover"
                }`}
              >
                {pl.emoji} {pl.label}
              </button>
            ))}
          </div>

          <textarea
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            placeholder="Nhập nội dung nhận xét..."
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/60"
          />

          <button
            onClick={handleSave}
            disabled={saving || !noiDung.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Lưu nhận xét
          </button>
        </div>
      </div>
    </div>
  );
}
