import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { isConfigured } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";

function GradeCell({ value, onSave }) {
  const [local, setLocal] = useState(value ?? "");
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(value ?? "");
  }, [value, focused]);

  const commit = async () => {
    setFocused(false);
    const current = value ?? "";
    if (String(local) === String(current)) return;
    setSaving(true);
    try {
      await onSave(local === "" ? "" : Number(local));
    } catch (err) {
      window.alert(err.message);
      setLocal(value ?? "");
    } finally {
      setSaving(false);
    }
  };

  return (
    <input
      type="number"
      min="0"
      max="10"
      step="0.1"
      value={local}
      onFocus={() => setFocused(true)}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      disabled={saving}
      className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white outline-none focus:border-emerald-400/50 disabled:opacity-50"
    />
  );
}

function Diem() {
  const configured = isConfigured();

  const { data: subjects, error: subjectsError } = useGetRowsQuery("monhoc", { skip: !configured });
  const { data: columns, error: columnsError } = useGetRowsQuery("cotdiem", { skip: !configured });
  const { data: students, error: studentsError } = useGetRowsQuery("hocsinh", { skip: !configured });
  const {
    data: scores,
    error: scoresError,
    isLoading: scoresLoading,
  } = useGetRowsQuery("diem", { skip: !configured });
  const error = subjectsError?.message || columnsError?.message || studentsError?.message || scoresError?.message;

  const [createRow] = useCreateRowMutation();
  const [updateRow] = useUpdateRowMutation();
  const [deleteRow] = useDeleteRowMutation();

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);
  const [savingColumn, setSavingColumn] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);
  const [deletingColumnId, setDeletingColumnId] = useState(null);

  useEffect(() => {
    if (!selectedSubjectId && subjects && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const selectedSubject = (subjects || []).find((s) => s.id === selectedSubjectId) || null;

  const subjectColumns = useMemo(
    () => (columns || []).filter((c) => c.monHocId === selectedSubjectId),
    [columns, selectedSubjectId]
  );

  const scoreByKey = useMemo(() => {
    const map = new Map();
    (scores || []).forEach((s) => map.set(`${s.cotDiemId}__${s.hocSinhId}`, s));
    return map;
  }, [scores]);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setSavingSubject(true);
    try {
      const created = await createRow({ table: "monhoc", data: { tenMon: newSubjectName.trim() } }).unwrap();
      setNewSubjectName("");
      setSelectedSubjectId(created.id);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Xoá môn "${subject.tenMon}"? Toàn bộ cột điểm và điểm số của môn này cũng sẽ bị xoá.`)) return;
    setDeletingSubjectId(subject.id);
    try {
      const relatedColumns = (columns || []).filter((c) => c.monHocId === subject.id);
      const relatedScores = (scores || []).filter((s) => s.monHocId === subject.id);
      for (const s of relatedScores) await deleteRow({ table: "diem", id: s.id }).unwrap();
      for (const c of relatedColumns) await deleteRow({ table: "cotdiem", id: c.id }).unwrap();
      await deleteRow({ table: "monhoc", id: subject.id }).unwrap();
      if (selectedSubjectId === subject.id) setSelectedSubjectId(null);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingSubjectId(null);
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim() || !selectedSubjectId) return;
    setSavingColumn(true);
    try {
      await createRow({
        table: "cotdiem",
        data: { monHocId: selectedSubjectId, tenCot: newColumnName.trim() },
      }).unwrap();
      setNewColumnName("");
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSavingColumn(false);
    }
  };

  const handleDeleteColumn = async (column) => {
    if (!window.confirm(`Xoá cột "${column.tenCot}"? Điểm đã nhập ở cột này sẽ bị xoá.`)) return;
    setDeletingColumnId(column.id);
    try {
      const relatedScores = (scores || []).filter((s) => s.cotDiemId === column.id);
      for (const s of relatedScores) await deleteRow({ table: "diem", id: s.id }).unwrap();
      await deleteRow({ table: "cotdiem", id: column.id }).unwrap();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingColumnId(null);
    }
  };

  const saveScore = async (column, student, value) => {
    const key = `${column.id}__${student.id}`;
    const existing = scoreByKey.get(key);
    const data = {
      monHocId: selectedSubjectId,
      cotDiemId: column.id,
      hocSinhId: student.id,
      hoVaTen: student.hoVaTen,
      diem: value,
    };
    if (existing) {
      await updateRow({ table: "diem", id: existing.id, data }).unwrap();
    } else {
      await createRow({ table: "diem", data }).unwrap();
    }
  };

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-slate-300">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Điểm
        </h1>
      </header>

      <div className="mt-8">
        <LopHocTabs />
      </div>

      {!configured ? (
        <NotConfiguredNotice />
      ) : (
        <main className="mt-10 flex flex-col gap-6">
          {error && (
            <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-center text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            {(subjects || []).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  s.id === selectedSubjectId
                    ? "bg-white/90 text-slate-900"
                    : "border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {s.tenMon}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddSubject} className="mx-auto flex w-full max-w-md items-center gap-2">
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Tên môn học mới (vd: Toán)"
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
            <button
              type="submit"
              disabled={savingSubject}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
            >
              {savingSubject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
              Thêm môn
            </button>
          </form>

          {selectedSubject && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {subjectColumns.map((c) => (
                  <span
                    key={c.id}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1.5 text-xs text-slate-300"
                  >
                    {c.tenCot}
                    <button
                      onClick={() => handleDeleteColumn(c)}
                      disabled={deletingColumnId === c.id}
                      aria-label="Xoá cột"
                      className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
                    >
                      {deletingColumnId === c.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" strokeWidth={2} />
                      )}
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => handleDeleteSubject(selectedSubject)}
                  disabled={deletingSubjectId === selectedSubject.id}
                  className="text-xs font-medium text-rose-300 transition-colors hover:text-rose-200 disabled:opacity-50"
                >
                  Xoá môn "{selectedSubject.tenMon}"
                </button>
              </div>

              <form onSubmit={handleAddColumn} className="mx-auto flex w-full max-w-md items-center gap-2">
                <input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Tên cột điểm mới (vd: Giữa kỳ)"
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
                />
                <button
                  type="submit"
                  disabled={savingColumn}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
                >
                  {savingColumn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                  Thêm cột
                </button>
              </form>

              {scoresLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang tải điểm...
                </div>
              ) : subjectColumns.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
                  Chưa có cột điểm nào cho môn này. Thêm cột điểm để bắt đầu.
                </div>
              ) : !students || students.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
                  Chưa có học sinh nào trong lớp.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Stt</th>
                        <th className="whitespace-nowrap px-4 py-3 font-medium">Họ và tên học sinh</th>
                        {subjectColumns.map((c) => (
                          <th key={c.id} className="whitespace-nowrap px-4 py-3 text-center font-medium">
                            {c.tenCot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, i) => (
                        <tr key={student.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-400">{i + 1}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-200">{student.hoVaTen}</td>
                          {subjectColumns.map((c) => {
                            const entry = scoreByKey.get(`${c.id}__${student.id}`);
                            return (
                              <td key={c.id} className="whitespace-nowrap px-4 py-3 text-center">
                                <GradeCell value={entry?.diem} onSave={(v) => saveScore(c, student, v)} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!selectedSubject && (subjects || []).length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
              Chưa có môn học nào. Thêm môn học để bắt đầu.
            </div>
          )}
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

export default Diem;
