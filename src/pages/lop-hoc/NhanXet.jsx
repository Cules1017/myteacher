import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2, MessageSquare, ChevronRight, Search } from "lucide-react";
import { isConfigured } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";
import LoadingState from "../../components/LoadingState";
import ConfirmModal from "../../components/ConfirmModal";
import { normalizeText } from "../../utils/text";

const PHAN_LOAI = [
  { key: "tich-cuc", label: "Tích cực", emoji: "✅", color: "bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30" },
  { key: "trung-lap", label: "Trung lập", emoji: "📝", color: "bg-slate-100 dark:bg-slate-400/10 text-text-muted border-slate-200 dark:border-slate-400/20" },
  { key: "tieu-cuc", label: "Tiêu cực", emoji: "❌", color: "bg-rose-100 dark:bg-rose-400/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-400/30" },
];

function getPhanLoai(key) {
  return PHAN_LOAI.find((p) => p.key === key) || PHAN_LOAI[1];
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Màn 1: Danh sách học sinh ───────────────────────────────────────────────
function StudentList({ students, comments, onSelect }) {
  const [search, setSearch] = useState("");

  const countByStudent = useMemo(() => {
    const map = {};
    (comments || []).forEach((c) => {
      if (!map[c.hocSinhId]) map[c.hocSinhId] = { total: 0, latest: null };
      map[c.hocSinhId].total += 1;
      if (!map[c.hocSinhId].latest || c.createdAt > map[c.hocSinhId].latest.createdAt) {
        map[c.hocSinhId].latest = c;
      }
    });
    return map;
  }, [comments]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = normalizeText(search.trim());
    return students.filter(s => normalizeText(s.hoVaTen || "").includes(q));
  }, [students, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Tìm học sinh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-base outline-none transition-colors focus:border-primary-500"
        />
      </div>

      <div className="flex flex-col gap-3">
        {filteredStudents.length === 0 ? (
          <p className="text-center text-sm text-text-muted py-8">Không tìm thấy học sinh.</p>
        ) : (
          filteredStudents.map((s, idx) => {
            const info = countByStudent[s.id];
            const latest = info?.latest;
            const pl = latest ? getPhanLoai(latest.phanLoai) : null;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:bg-surface-hover hover:border-primary-300 dark:hover:border-primary-400/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20 text-sm font-bold text-primary-700 dark:text-primary-300">
                  {students.findIndex(x => x.id === s.id) + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-base truncate">{s.hoVaTen}</p>
                  {latest ? (
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {pl?.emoji} {latest.noiDung}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted mt-0.5">Chưa có nhận xét</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {info?.total > 0 && (
                    <span className="rounded-full bg-primary-100 dark:bg-primary-500/20 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
                      {info.total}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Màn 2: Nhận xét chi tiết ────────────────────────────────────────────────
function StudentComments({ student, comments, onBack }) {
  const [createMutation] = useCreateRowMutation();
  const [updateMutation] = useUpdateRowMutation();
  const [deleteMutation] = useDeleteRowMutation();

  const [noiDung, setNoiDung] = useState("");
  const [phanLoai, setPhanLoai] = useState("tich-cuc");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editNoiDung, setEditNoiDung] = useState("");
  const [editPhanLoai, setEditPhanLoai] = useState("tich-cuc");
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Bộ lọc
  const [filterLoai, setFilterLoai] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const myComments = useMemo(() => {
    let list = (comments || []).filter((c) => c.hocSinhId === student.id);
    if (filterLoai !== "all") list = list.filter((c) => c.phanLoai === filterLoai);
    if (filterFrom) list = list.filter((c) => c.createdAt >= filterFrom);
    if (filterTo) list = list.filter((c) => c.createdAt <= filterTo + "T23:59:59");
    return list.slice().sort((a, b) => b.createdAt?.localeCompare(a.createdAt));
  }, [comments, student.id, filterLoai, filterFrom, filterTo]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!noiDung.trim()) return;
    setSaving(true);
    try {
      await createMutation({
        table: "nhanxet",
        data: { hocSinhId: student.id, noiDung: noiDung.trim(), phanLoai },
      }).unwrap();
      setNoiDung("");
      setPhanLoai("tich-cuc");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setEditNoiDung(c.noiDung);
    setEditPhanLoai(c.phanLoai);
  };

  const handleEdit = async () => {
    if (!editNoiDung.trim()) return;
    setEditSaving(true);
    try {
      await updateMutation({
        table: "nhanxet",
        id: editingId,
        data: { noiDung: editNoiDung.trim(), phanLoai: editPhanLoai },
      }).unwrap();
      setEditingId(null);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = (c) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xoá nhận xét",
      message: `Bạn có chắc muốn xoá nhận xét này không?`,
      isDangerous: true,
      onConfirm: async () => {
        setDeletingId(c.id);
        try {
          await deleteMutation({ table: "nhanxet", id: c.id }).unwrap();
        } finally {
          setDeletingId(null);
          setConfirmConfig(null);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {confirmConfig && <ConfirmModal {...confirmConfig} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="font-bold text-text-base text-lg">{student.hoVaTen}</h2>
          <p className="text-xs text-text-muted">{myComments.length} nhận xét</p>
        </div>
      </div>

      {/* Form thêm nhận xét */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3"
      >
        <p className="text-sm font-semibold text-text-base">Thêm nhận xét mới</p>

        {/* Chọn loại */}
        <div className="flex gap-2 flex-wrap">
          {PHAN_LOAI.map((pl) => (
            <button
              key={pl.key}
              type="button"
              onClick={() => setPhanLoai(pl.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
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
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/60"
        />

        <button
          type="submit"
          disabled={saving || !noiDung.trim()}
          className="self-end flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Lưu
        </button>
      </form>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterLoai}
          onChange={(e) => setFilterLoai(e.target.value)}
          className="rounded-xl border border-border bg-transparent px-3 py-1.5 text-sm text-text-base outline-none focus:border-primary-400/50"
        >
          <option value="all">Tất cả loại</option>
          {PHAN_LOAI.map((pl) => (
            <option key={pl.key} value={pl.key}>{pl.emoji} {pl.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="rounded-xl border border-border bg-transparent px-3 py-1.5 text-sm text-text-base outline-none focus:border-primary-400/50"
        />
        <span className="text-text-muted text-sm">→</span>
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          className="rounded-xl border border-border bg-transparent px-3 py-1.5 text-sm text-text-base outline-none focus:border-primary-400/50"
        />
        {(filterLoai !== "all" || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterLoai("all"); setFilterFrom(""); setFilterTo(""); }}
            className="text-xs text-text-muted underline hover:text-text-base"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Danh sách nhận xét */}
      {myComments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-text-muted">
          <MessageSquare className="h-10 w-10 opacity-30" />
          <p className="text-sm">Chưa có nhận xét nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myComments.map((c) => {
            const pl = getPhanLoai(c.phanLoai);
            const isEditing = editingId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${pl.color}`}>
                    {pl.emoji} {pl.label}
                  </span>
                  <span className="text-xs text-text-muted">{formatDateTime(c.createdAt)}</span>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 flex-wrap">
                      {PHAN_LOAI.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setEditPhanLoai(p.key)}
                          className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
                            editPhanLoai === p.key ? p.color : "border-border text-text-muted hover:bg-surface-hover"
                          }`}
                        >
                          {p.emoji} {p.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editNoiDung}
                      onChange={(e) => setEditNoiDung(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/60"
                    />
                    <div className="flex gap-2 self-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover"
                      >
                        <X className="h-3 w-3" /> Huỷ
                      </button>
                      <button
                        onClick={handleEdit}
                        disabled={editSaving}
                        className="flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
                      >
                        {editSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-base whitespace-pre-wrap">{c.noiDung}</p>
                )}

                {!isEditing && (
                  <div className="flex gap-2 self-end">
                    <button
                      onClick={() => openEdit(c)}
                      className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
                    >
                      <Pencil className="h-3 w-3" /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      className="flex items-center gap-1 rounded-full border border-rose-200 dark:border-rose-400/30 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-300 transition-colors hover:bg-rose-100 dark:hover:bg-rose-400/10 disabled:opacity-50"
                    >
                      {deletingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Xoá
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
function NhanXet() {
  const configured = isConfigured();
  const { data: students, isLoading: loadingStudents } = useGetRowsQuery("hocsinh", { skip: !configured });
  const { data: comments, isLoading: loadingComments } = useGetRowsQuery("nhanxet", { skip: !configured });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const isLoading = loadingStudents || loadingComments;

  const visibleStudents = useMemo(
    () => (students || []).filter((s) => !s.hidden),
    [students]
  );

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border bg-surface px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-text-base via-text-muted to-text-base/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Nhận xét
        </h1>
        <p className="max-w-xl text-base text-text-muted sm:text-lg">
          Theo dõi và ghi chép nhận xét cho từng học sinh.
        </p>
      </header>

      <main className="mt-8 flex flex-col gap-5">
        <LopHocTabs />

        {!configured ? (
          <p className="text-center text-text-muted py-12">Chưa cấu hình Google Sheets.</p>
        ) : isLoading ? (
          <LoadingState />
        ) : selectedStudent ? (
          <StudentComments
            student={selectedStudent}
            comments={comments}
            onBack={() => setSelectedStudent(null)}
          />
        ) : (
          <StudentList
            students={visibleStudents}
            comments={comments}
            onSelect={setSelectedStudent}
          />
        )}
      </main>
    </>
  );
}

export default NhanXet;
