import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, X, Settings2 } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import ConfirmModal from "../../components/ConfirmModal";
import { isConfigured } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";
import { getCurrentMonHocId } from "../../utils/timetable";

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
      className="w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-center text-sm text-text-base outline-none focus:border-primary-400/50 disabled:opacity-50"
    />
  );
}

function Diem() {
  const configured = isConfigured();

  const { data: subjects, isLoading: subjectsLoading, error: subjectsError } = useGetRowsQuery("monhoc", { skip: !configured });
  const { data: columns, isLoading: columnsLoading, error: columnsError } = useGetRowsQuery("cotdiem", { skip: !configured });
  const { data: students, isLoading: studentsLoading, error: studentsError } = useGetRowsQuery("hocsinh", { skip: !configured });
  const { data: thoikhoabieuRows } = useGetRowsQuery("thoikhoabieu", { skip: !configured });
  const { data: khungGioRows } = useGetRowsQuery("khunggio", { skip: !configured });
  const {
    data: scores,
    error: scoresError,
    isLoading: scoresLoading,
  } = useGetRowsQuery("diem", { skip: !configured });
  const error = subjectsError?.message || columnsError?.message || studentsError?.message || scoresError?.message;
  const isInitialLoading = subjectsLoading || columnsLoading || studentsLoading || scoresLoading;

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
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  useEffect(() => {
    if (selectedSubjectId || !subjects || subjects.length === 0) return;
    const currentId = getCurrentMonHocId({
      thoikhoabieuRows: thoikhoabieuRows || [],
      khungGioRows: khungGioRows || [],
      monhocRows: subjects,
    });
    setSelectedSubjectId(currentId || subjects[0].id);
  }, [subjects, selectedSubjectId, thoikhoabieuRows, khungGioRows]);

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
      setIsAddingSubject(false);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = (subject) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xoá môn học",
      message: `Xoá môn "${subject.tenMon}"? Toàn bộ cột điểm và điểm số của môn này cũng sẽ bị xoá.`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setDeletingSubjectId(subject.id);
        try {
          const relatedColumns = (columns || []).filter((c) => c.monHocId === subject.id);
          const relatedScores = (scores || []).filter((s) => s.monHocId === subject.id);
          for (const s of relatedScores) await deleteRow({ table: "diem", id: s.id }).unwrap();
          for (const c of relatedColumns) await deleteRow({ table: "cotdiem", id: c.id }).unwrap();
          await deleteRow({ table: "monhoc", id: subject.id }).unwrap();
          if (selectedSubjectId === subject.id) setSelectedSubjectId(null);
          setConfirmConfig(null);
        } catch (err) {
          window.alert(err.message);
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        } finally {
          setDeletingSubjectId(null);
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
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
      setIsAddingColumn(false);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSavingColumn(false);
    }
  };

  const handleDeleteColumn = (column) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xoá cột điểm",
      message: `Xoá cột "${column.tenCot}"? Điểm đã nhập ở cột này sẽ bị xoá.`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setDeletingColumnId(column.id);
        try {
          const relatedScores = (scores || []).filter((s) => s.cotDiemId === column.id);
          for (const s of relatedScores) await deleteRow({ table: "diem", id: s.id }).unwrap();
          await deleteRow({ table: "cotdiem", id: column.id }).unwrap();
          setConfirmConfig(null);
        } catch (err) {
          window.alert(err.message);
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        } finally {
          setDeletingColumnId(null);
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
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
        <span className="rounded-full border border-border bg-transparent px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
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
          <ConfirmModal {...confirmConfig} />
          {error && (
            <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-center text-sm text-rose-200">
              {error}
            </div>
          )}

          {isInitialLoading ? (
            <LoadingState emoji="✨" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {(subjects || []).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubjectId(s.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      s.id === selectedSubjectId
                        ? "bg-primary-500 text-white shadow-md"
                        : "border border-border text-text-base hover:bg-surface-hover hover:text-text-base"
                    }`}
                  >
                    {s.tenMon}
                  </button>
                ))}

                {isAddingSubject ? (
                  <form onSubmit={handleAddSubject} className="ml-2 flex items-center gap-2">
                    <input
                      autoFocus
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Tên môn..."
                      className="w-32 rounded-full border border-border bg-transparent px-3 py-1.5 text-sm text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
                    />
                    <button
                      type="submit"
                      disabled={savingSubject}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-primary-600 dark:text-primary-400 transition-colors hover:bg-primary-500/30 disabled:opacity-60"
                    >
                      {savingSubject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubject(false)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingSubject(true)}
                    className="ml-2 flex items-center gap-1.5 rounded-full border border-border border-dashed px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-border hover:text-text-base"
                  >
                    <Plus className="h-3.5 w-3.5" /> Thêm môn
                  </button>
                )}
              </div>

              {selectedSubject && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-transparent px-4 py-3 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mr-2 text-sm font-medium text-text-base">Cột điểm:</span>
                      
                      {subjectColumns.map((c) => (
                        <span
                          key={c.id}
                          className="flex items-center gap-1.5 rounded-full bg-bg-base/50 py-1 pl-3 pr-1.5 text-xs text-text-base ring-1 ring-border"
                        >
                          {c.tenCot}
                          <button
                            onClick={() => handleDeleteColumn(c)}
                            disabled={deletingColumnId === c.id}
                            aria-label="Xoá cột"
                            className="flex h-5 w-5 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
                          >
                            {deletingColumnId === c.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </span>
                      ))}

                      {isAddingColumn ? (
                        <form onSubmit={handleAddColumn} className="ml-2 flex items-center gap-2">
                          <input
                            autoFocus
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            placeholder="Tên cột..."
                            className="w-32 rounded-full border border-border bg-transparent px-3 py-1 text-xs text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
                          />
                          <button
                            type="submit"
                            disabled={savingColumn}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/20 text-primary-600 dark:text-primary-400 transition-colors hover:bg-primary-500/30 disabled:opacity-60"
                          >
                            {savingColumn ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" strokeWidth={2.5} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingColumn(false)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setIsAddingColumn(true)}
                          className="ml-2 flex items-center gap-1 rounded-full border border-border border-dashed px-2.5 py-1 text-[11px] text-text-muted transition-colors hover:border-border hover:text-text-base"
                        >
                          <Plus className="h-3 w-3" /> Thêm cột
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteSubject(selectedSubject)}
                      disabled={deletingSubjectId === selectedSubject.id}
                      className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-rose-100 dark:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 disabled:opacity-50"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Xoá môn học
                    </button>
                  </div>

                  {subjectColumns.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-transparent px-6 py-12 text-center text-text-muted">
                      Chưa có cột điểm nào cho môn này. Thêm cột điểm để bắt đầu.
                    </div>
                  ) : !students || students.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-transparent px-6 py-12 text-center text-text-muted">
                      Chưa có học sinh nào trong lớp.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-border bg-surface backdrop-blur-xl">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
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
                            <tr key={student.id} className="border-b border-border last:border-0 hover:bg-surface">
                              <td className="whitespace-nowrap px-4 py-3 text-text-muted">{i + 1}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-text-base">{student.hoVaTen}</td>
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
                <div className="rounded-3xl border border-border bg-transparent px-6 py-12 text-center text-text-muted">
                  Chưa có môn học nào. Thêm môn học để bắt đầu.
                </div>
              )}
            </>
          )}
        </main>
      )}
    </>
  );
}

function NotConfiguredNotice() {
  return (
    <div className="mt-10 rounded-3xl border border-amber-400/25 bg-amber-400/5 px-6 py-8 text-center text-text-base">
      <p className="font-semibold text-amber-200">Chưa kết nối được với Google Sheet.</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">
        Cần cấu hình <code className="rounded bg-transparent px-1.5 py-0.5">VITE_APPS_SCRIPT_URL</code> và{" "}
        <code className="rounded bg-transparent px-1.5 py-0.5">VITE_APPS_SCRIPT_TOKEN</code> trong file{" "}
        <code className="rounded bg-transparent px-1.5 py-0.5">.env</code>.
      </p>
    </div>
  );
}

export default Diem;
