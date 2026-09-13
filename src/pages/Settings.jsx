import { useEffect, useState } from "react";
import { Moon, Info, CalendarRange, CalendarOff, Plus, Trash2, Loader2 } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { isConfigured } from "../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../store/sheetApi";

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

        <SchoolYearSection />
        <ExcludedDatesSection />
      </main>
    </>
  );
}

function SchoolYearSection() {
  const configured = isConfigured();
  const { data: rows } = useGetRowsQuery("namhoc", { skip: !configured });
  const namhoc = rows?.[0];

  const [createRowMutation] = useCreateRowMutation();
  const [updateRowMutation] = useUpdateRowMutation();

  const [ngayBatDau, setNgayBatDau] = useState("");
  const [ngayKetThuc, setNgayKetThuc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (namhoc) {
      setNgayBatDau(namhoc.ngayBatDau || "");
      setNgayKetThuc(namhoc.ngayKetThuc || "");
    }
  }, [namhoc]);

  if (!configured) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = { ngayBatDau, ngayKetThuc };
      if (namhoc) {
        await updateRowMutation({ table: "namhoc", id: namhoc.id, data }).unwrap();
      } else {
        await createRowMutation({ table: "namhoc", data }).unwrap();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard accent="from-sky-400 to-indigo-500" className="flex-col items-stretch gap-4 hover:-translate-y-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
          <CalendarRange className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="relative flex flex-col gap-0.5">
          <h2 className="font-semibold text-white">Năm học</h2>
          <p className="text-sm text-slate-300">Dùng để tính tuần học thực trong Lịch.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="relative flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          Ngày bắt đầu
          <input
            type="date"
            value={ngayBatDau}
            onChange={(e) => setNgayBatDau(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          Ngày kết thúc
          <input
            type="date"
            value={ngayKetThuc}
            onChange={(e) => setNgayKetThuc(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400/50"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu
        </button>
      </form>
      {error && <p className="relative text-sm text-rose-300">{error}</p>}
    </GlassCard>
  );
}

function ExcludedDatesSection() {
  const configured = isConfigured();
  const { data: rows } = useGetRowsQuery("ngayloaitru", { skip: !configured });

  const [createRowMutation] = useCreateRowMutation();
  const [deleteRowMutation] = useDeleteRowMutation();

  const [tieuDe, setTieuDe] = useState("");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  if (!configured) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createRowMutation({
        table: "ngayloaitru",
        data: { tieuDe, tuNgay, denNgay: denNgay || tuNgay },
      }).unwrap();
      setTieuDe("");
      setTuNgay("");
      setDenNgay("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xoá "${row.tieuDe}"?`)) return;
    setDeletingId(row.id);
    try {
      await deleteRowMutation({ table: "ngayloaitru", id: row.id }).unwrap();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <GlassCard accent="from-amber-400 to-rose-400" className="flex-col items-stretch gap-4 hover:-translate-y-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
          <CalendarOff className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="relative flex flex-col gap-0.5">
          <h2 className="font-semibold text-white">Ngày loại trừ (nghỉ lễ)</h2>
          <p className="text-sm text-slate-300">Tuần trùng khít 1 đợt nghỉ sẽ hiện tên đợt nghỉ thay vì số tuần.</p>
        </div>
      </div>

      {rows && rows.length > 0 && (
        <ul className="relative flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium text-white">{row.tieuDe}</span>
                <span className="text-xs text-slate-400">
                  {row.tuNgay}
                  {row.denNgay && row.denNgay !== row.tuNgay ? ` → ${row.denNgay}` : ""}
                </span>
              </div>
              <button
                onClick={() => handleDelete(row)}
                disabled={deletingId === row.id}
                aria-label="Xoá"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
              >
                {deletingId === row.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="relative flex flex-wrap items-end gap-3">
        <label className="flex flex-1 flex-col gap-1.5 text-sm text-slate-300">
          Tiêu đề
          <input
            value={tieuDe}
            onChange={(e) => setTieuDe(e.target.value)}
            placeholder="Nghỉ Tết Âm lịch"
            required
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          Từ ngày
          <input
            type="date"
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
            required
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400/50"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          Đến ngày
          <input
            type="date"
            value={denNgay}
            onChange={(e) => setDenNgay(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400/50"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
          Thêm
        </button>
      </form>
      {error && <p className="relative text-sm text-rose-300">{error}</p>}
    </GlassCard>
  );
}

export default Settings;
