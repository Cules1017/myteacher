import { useEffect, useState } from "react";
import { Moon, Info, CalendarRange, CalendarOff, CalendarClock, Plus, Trash2, Loader2, Link, Sun, Monitor, Palette } from "lucide-react";
import GlassCard from "../components/GlassCard";
import LoadingState from "../components/LoadingState";
import { isConfigured } from "../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../store/sheetApi";
import { SESSIONS } from "../utils/timetable";
import { useTheme } from "../contexts/ThemeContext";

const THEMES = [
  { id: 'light', name: 'Sáng', icon: Sun },
  { id: 'dark', name: 'Tối', icon: Moon },
  { id: 'system', name: 'Hệ thống', icon: Monitor },
];

const COLORS = [
  { id: 'emerald', name: 'Ngọc lục bảo', class: 'bg-emerald-500' },
  { id: 'blue', name: 'Xanh lam', class: 'bg-blue-500' },
  { id: 'violet', name: 'Tím', class: 'bg-violet-500' },
  { id: 'rose', name: 'Hồng', class: 'bg-rose-500' },
  { id: 'amber', name: 'Vàng cam', class: 'bg-amber-500' },
];

function Settings() {
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border bg-transparent px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Cài đặt
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Tùy chỉnh
        </h1>
        <p className="max-w-xl text-base text-text-muted sm:text-lg">
          Một vài thông tin và tùy chọn của ứng dụng.
        </p>
      </header>

      <main className="mt-12 flex flex-col gap-4">
        {/* THEME SETTINGS */}
        <GlassCard accent="from-indigo-500 to-fuchsia-400" className="flex-col gap-5 hover:-translate-y-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-hover ring-1 ring-border">
              <Palette className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="relative flex flex-1 flex-col gap-0.5">
              <h2 className="font-semibold text-text-base">Giao diện & Màu sắc</h2>
              <p className="text-sm text-text-base">Tuỳ chỉnh chế độ hiển thị và màu chủ đạo.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mt-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-muted">Chế độ hiển thị</span>
              <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-surface-hover ring-1 ring-border w-fit">
                {THEMES.map(t => {
                  const Icon = t.icon;
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-surface shadow-sm text-text-base' 
                          : 'text-text-muted hover:text-text-base'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-muted">Màu chủ đạo</span>
              <div className="flex flex-wrap items-center gap-3">
                {COLORS.map(c => {
                  const isActive = primaryColor === c.id;
                  return (
                    <button
                      key={c.id}
                      title={c.name}
                      onClick={() => setPrimaryColor(c.id)}
                      className={`h-8 w-8 rounded-full transition-all flex items-center justify-center ${c.class} ${
                        isActive ? 'ring-2 ring-text-base ring-offset-2 ring-offset-bg-base scale-110' : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard accent="from-blue-500 to-primary-400" className="flex-row items-center gap-5 hover:-translate-y-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-hover ring-1 ring-border">
            <Info className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="relative flex flex-1 flex-col gap-0.5">
            <h2 className="font-semibold text-text-base">Phiên bản</h2>
            <p className="text-sm text-text-base">Tiện ích của My — v1.0.0</p>
          </div>
        </GlassCard>

        <SchoolYearSection />
        <PeriodTimesSection />
        <ExcludedDatesSection />
        <TaiLieuSection />
      </main>
    </>
  );
}

function PeriodTimesSection() {
  const configured = isConfigured();
  const { data: rows, isLoading } = useGetRowsQuery("khunggio", { skip: !configured });

  const [createRowMutation] = useCreateRowMutation();
  const [updateRowMutation] = useUpdateRowMutation();
  const [deleteRowMutation] = useDeleteRowMutation();

  const [addingBuoi, setAddingBuoi] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  if (!configured) return null;

  const rowsByBuoi = (buoi) =>
    (rows || [])
      .filter((r) => r.buoi === buoi)
      .slice()
      .sort((a, b) => Number(a.tiet) - Number(b.tiet));

  const handleTimeChange = async (row, field, value) => {
    setError(null);
    try {
      await updateRowMutation({ table: "khunggio", id: row.id, data: { [field]: value } }).unwrap();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdd = async (buoi) => {
    const existing = rowsByBuoi(buoi);
    const nextTiet = existing.length > 0 ? Math.max(...existing.map((r) => Number(r.tiet))) + 1 : 1;
    setAddingBuoi(buoi);
    setError(null);
    try {
      await createRowMutation({
        table: "khunggio",
        data: { buoi, tiet: nextTiet, gioBatDau: "", gioKetThuc: "" },
      }).unwrap();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingBuoi(null);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xoá tiết ${row.tiet} (buổi ${row.buoi.toLowerCase()})?`)) return;
    setDeletingId(row.id);
    try {
      await deleteRowMutation({ table: "khunggio", id: row.id }).unwrap();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <GlassCard accent="from-violet-500 to-sky-400" className="flex-col items-stretch gap-4 hover:-translate-y-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-hover ring-1 ring-border">
          <CalendarClock className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="relative flex flex-col gap-0.5">
          <h2 className="font-semibold text-text-base">Giờ tiết học</h2>
          <p className="text-sm text-text-base">Dùng để hiện cột "Thời gian" trong Thời khoá biểu.</p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full">
            <LoadingState emoji="⚙️" className="py-8" />
          </div>
        ) : (
          SESSIONS.map((buoi) => (
            <div key={buoi} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
              <h3 className="text-sm font-semibold text-text-base">Buổi {buoi.toLowerCase()}</h3>
              <div className="flex flex-col gap-2">
                {rowsByBuoi(buoi).map((row) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-center text-sm font-medium text-text-base">
                      Tiết {row.tiet}
                    </span>
                    <input
                      type="time"
                      value={row.gioBatDau || ""}
                      onChange={(e) => handleTimeChange(row, "gioBatDau", e.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm text-text-base outline-none focus:border-primary-400/50"
                    />
                    <span className="text-text-muted">–</span>
                    <input
                      type="time"
                      value={row.gioKetThuc || ""}
                      onChange={(e) => handleTimeChange(row, "gioKetThuc", e.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm text-text-base outline-none focus:border-primary-400/50"
                    />
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={deletingId === row.id}
                      aria-label="Xoá tiết"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-base transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
                    >
                      {deletingId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleAdd(buoi)}
                disabled={addingBuoi === buoi}
                className="mt-1 flex items-center justify-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                {addingBuoi === buoi ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
                Thêm tiết
              </button>
            </div>
          ))
        )}
      </div>
      {error && <p className="relative text-sm text-rose-300">{error}</p>}
    </GlassCard>
  );
}

function SchoolYearSection() {
  const configured = isConfigured();
  const { data: rows, isLoading } = useGetRowsQuery("namhoc", { skip: !configured });
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-hover ring-1 ring-border">
          <CalendarRange className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="relative flex flex-col gap-0.5">
          <h2 className="font-semibold text-text-base">Năm học</h2>
          <p className="text-sm text-text-base">Dùng để tính tuần học thực trong Lịch.</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState emoji="⚙️" className="py-4" />
      ) : (
        <form onSubmit={handleSave} className="relative flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm text-text-base">
            Ngày bắt đầu
            <input
              type="date"
              value={ngayBatDau}
              onChange={(e) => setNgayBatDau(e.target.value)}
              className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-text-base">
            Ngày kết thúc
            <input
              type="date"
              value={ngayKetThuc}
              onChange={(e) => setNgayKetThuc(e.target.value)}
              className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu
          </button>
        </form>
      )}
      {error && <p className="relative text-sm text-rose-300">{error}</p>}
    </GlassCard>
  );
}

function ExcludedDatesSection() {
  const configured = isConfigured();
  const { data: rows, isLoading } = useGetRowsQuery("ngayloaitru", { skip: !configured });

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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-hover ring-1 ring-border">
          <CalendarOff className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="relative flex flex-col gap-0.5">
          <h2 className="font-semibold text-text-base">Ngày loại trừ (nghỉ lễ)</h2>
          <p className="text-sm text-text-base">Tuần trùng khít 1 đợt nghỉ sẽ hiện tên đợt nghỉ thay vì số tuần.</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState emoji="⚙️" className="py-4" />
      ) : (
        <>
          {rows && rows.length > 0 && (
            <ul className="relative flex flex-col gap-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-text-base">{row.tieuDe}</span>
                    <span className="text-xs text-text-muted">
                      {row.tuNgay}
                      {row.denNgay && row.denNgay !== row.tuNgay ? ` → ${row.denNgay}` : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(row)}
                    disabled={deletingId === row.id}
                    aria-label="Xoá"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-base transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
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
            <label className="flex flex-1 flex-col gap-1.5 text-sm text-text-base">
              Tiêu đề
              <input
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                placeholder="Nghỉ Tết Âm lịch"
                required
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-text-base">
              Từ ngày
              <input
                type="date"
                value={tuNgay}
                onChange={(e) => setTuNgay(e.target.value)}
                required
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-text-base">
              Đến ngày
              <input
                type="date"
                value={denNgay}
                onChange={(e) => setDenNgay(e.target.value)}
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
              Thêm
            </button>
          </form>
        </>
      )}
      {error && <p className="relative text-sm text-rose-300">{error}</p>}
    </GlassCard>
  );
}

export default Settings;

function TaiLieuSection() {
  const configured = isConfigured();
  const { data: rows, isLoading } = useGetRowsQuery("tailieu", { skip: !configured });

  const [createRowMutation] = useCreateRowMutation();
  const [deleteRowMutation] = useDeleteRowMutation();

  const [tieuDe, setTieuDe] = useState("");
  const [moTa, setMoTa] = useState("");
  const [lienKet, setLienKet] = useState("");
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
        table: "tailieu",
        data: { tieuDe, moTa, lienKet },
      }).unwrap();
      setTieuDe("");
      setMoTa("");
      setLienKet("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xoá tài liệu "${row.tieuDe}"?`)) return;
    setDeletingId(row.id);
    try {
      await deleteRowMutation({ table: "tailieu", id: row.id }).unwrap();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <GlassCard accent="from-emerald-400 to-teal-400" className="flex-col items-stretch gap-4 hover:-translate-y-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface ring-1 ring-border">
          <Link className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="relative flex flex-col gap-0.5">
          <h2 className="font-semibold text-text-base">Thư mục tài liệu</h2>
          <p className="text-sm text-text-base">Cấu hình danh sách thư mục hiển thị ở trang Tài Liệu.</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState emoji="⚙️" className="py-4" />
      ) : (
        <>
          {rows && rows.length > 0 && (
            <ul className="relative flex flex-col gap-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-text-base">{row.tieuDe}</span>
                    <span className="text-xs text-text-muted">{row.moTa}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(row)}
                    disabled={deletingId === row.id}
                    aria-label="Xoá"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-base transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
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
            <label className="flex flex-col gap-1.5 text-sm text-text-base">
              Tên tài liệu / Thư mục
              <input
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                placeholder="VD: Thư mục giảng dạy"
                required
                className="w-48 rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-sm text-text-base">
              Mô tả ngắn gọn
              <input
                value={moTa}
                onChange={(e) => setMoTa(e.target.value)}
                placeholder="Kho tài liệu, giáo án..."
                required
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-sm text-text-base min-w-[200px]">
              Đường link (URL)
              <input
                type="url"
                value={lienKet}
                onChange={(e) => setLienKet(e.target.value)}
                placeholder="https://drive.google.com/..."
                required
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
              Thêm
            </button>
          </form>
        </>
      )}
      {error && <p className="relative text-sm text-rose-300">{error}</p>}
    </GlassCard>
  );
}
