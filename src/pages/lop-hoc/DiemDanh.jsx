import { useMemo, useState } from "react";
import { Search, Loader2, Pencil, Trash2, X } from "lucide-react";
import { isConfigured } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import { normalizeText } from "../../utils/text";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";

const TABLE = "diemdanh";
const LOAI_VANG_OPTIONS = ["Có phép", "Không phép"];

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateVN(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function DiemDanh() {
  const configured = isConfigured();

  const [date, setDate] = useState(todayStr());

  const {
    data: students,
    error: studentsQueryError,
    refetch: refetchStudents,
  } = useGetRowsQuery("hocsinh", { skip: !configured });
  const {
    data: attendance,
    isLoading: attendanceLoading,
    error: attendanceQueryError,
    refetch: refetchAttendance,
  } = useGetRowsQuery(TABLE, { skip: !configured });
  const error = studentsQueryError?.message || attendanceQueryError?.message;
  const refresh = () => {
    refetchStudents();
    refetchAttendance();
  };

  const [createRowMutation] = useCreateRowMutation();
  const [updateRowMutation] = useUpdateRowMutation();
  const [deleteRowMutation] = useDeleteRowMutation();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // { id, hoVaTen }
  const [editingRecord, setEditingRecord] = useState(null);
  const [loaiVang, setLoaiVang] = useState(LOAI_VANG_OPTIONS[0]);
  const [ghiChu, setGhiChu] = useState("");
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const attendanceForDate = useMemo(
    () => (attendance || []).filter((a) => a.ngay === date),
    [attendance, date]
  );

  const attendanceByStudentId = useMemo(() => {
    const map = new Map();
    attendanceForDate.forEach((a) => map.set(a.hocSinhId, a));
    return map;
  }, [attendanceForDate]);

  const searchResults = useMemo(() => {
    if (!query.trim() || !students) return [];
    const q = normalizeText(query);
    return students.filter((s) => normalizeText(s.hoVaTen).includes(q)).slice(0, 8);
  }, [query, students]);

  const selectStudent = ({ id, hoVaTen }) => {
    const existing = attendanceByStudentId.get(id);
    setSelected({ id, hoVaTen });
    setEditingRecord(existing || null);
    setLoaiVang(existing ? existing.loaiVang : LOAI_VANG_OPTIONS[0]);
    setGhiChu(existing ? existing.ghiChu : "");
    setFormError(null);
    setQuery("");
  };

  const closeMarkForm = () => {
    setSelected(null);
    setEditingRecord(null);
  };

  const handleSaveMark = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const data = {
        ngay: date,
        hocSinhId: selected.id,
        hoVaTen: selected.hoVaTen,
        loaiVang,
        ghiChu,
      };
      if (editingRecord) {
        await updateRowMutation({ table: TABLE, id: editingRecord.id, data }).unwrap();
      } else {
        await createRowMutation({ table: TABLE, data }).unwrap();
      }
      closeMarkForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Xoá ghi nhận vắng của "${record.hoVaTen}"?`)) return;
    setDeletingId(record.id);
    try {
      await deleteRowMutation({ table: TABLE, id: record.id }).unwrap();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-slate-300">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Điểm danh
        </h1>
      </header>

      <div className="mt-8">
        <LopHocTabs />
      </div>

      {!configured ? (
        <NotConfiguredNotice />
      ) : (
        <main className="mt-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Ngày điểm danh
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400/50"
              />
            </label>
            {date !== todayStr() && (
              <button
                onClick={() => setDate(todayStr())}
                className="text-sm font-medium text-emerald-300 transition-colors hover:text-emerald-200"
              >
                Hôm nay
              </button>
            )}
          </div>

          {error && (
            <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-center text-sm text-rose-200">
              {error}{" "}
              <button onClick={refresh} className="ml-2 font-semibold underline">
                Thử lại
              </button>
            </div>
          )}

          <div className="relative mx-auto w-full max-w-md">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm học sinh để ghi nhận vắng..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
            {query.trim() && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">Không tìm thấy học sinh.</p>
                ) : (
                  searchResults.map((s) => {
                    const marked = attendanceByStudentId.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
                      >
                        <span>{s.hoVaTen}</span>
                        {marked && <span className="text-xs text-amber-300">Đã ghi nhận</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {selected && (
            <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">{selected.hoVaTen}</h2>
                <button
                  onClick={closeMarkForm}
                  aria-label="Đóng"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSaveMark} className="mt-4 flex flex-col gap-4">
                <div className="flex gap-2">
                  {LOAI_VANG_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setLoaiVang(opt)}
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        loaiVang === opt
                          ? "bg-white/90 text-slate-900"
                          : "border border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Ghi chú (không bắt buộc)"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50"
                />
                {formError && <p className="text-sm text-rose-300">{formError}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingRecord ? "Cập nhật" : "Lưu"}
                </button>
              </form>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-center text-sm font-medium text-slate-400">
              Danh sách vắng ngày {formatDateVN(date)} ({attendanceForDate.length})
            </h2>

            {attendanceLoading && !error ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải điểm danh...
              </div>
            ) : attendanceForDate.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
                Chưa ghi nhận học sinh vắng trong ngày này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Họ và tên học sinh</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Loại vắng</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Ghi chú</th>
                      <th className="px-4 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceForDate.map((record) => (
                      <tr key={record.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-200">{record.hoVaTen}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              record.loaiVang === "Có phép"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-rose-400/10 text-rose-300"
                            }`}
                          >
                            {record.loaiVang}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{record.ghiChu || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => selectStudent({ id: record.hocSinhId, hoVaTen: record.hoVaTen })}
                              aria-label="Sửa"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleDelete(record)}
                              disabled={deletingId === record.id}
                              aria-label="Xoá"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
                            >
                              {deletingId === record.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}

function NotConfiguredNotice() {
  return (
    <div className="mt-10 rounded-3xl border border-amber-400/25 bg-amber-400/5 px-6 py-8 text-center text-slate-300">
      <p className="font-semibold text-amber-200">Chưa kết nối được với Google Sheet.</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
        Cần cấu hình <code className="rounded bg-black/30 px-1.5 py-0.5">VITE_APPS_SCRIPT_URL</code> và{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5">VITE_APPS_SCRIPT_TOKEN</code> trong file{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5">.env</code>.
      </p>
    </div>
  );
}

export default DiemDanh;
