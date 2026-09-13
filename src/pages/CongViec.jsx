import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, X, Check, AlertTriangle, Settings2 } from "lucide-react";
import LoadingState from "../components/LoadingState";
import ConfirmModal from "../components/ConfirmModal";
import { isConfigured } from "../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../store/sheetApi";
import {
  getTypeIcon,
  getTodoType,
  sortTodos,
  accentTextClass,
  accentSoftClass,
  accentSwatchClass,
  combineTodoTypes,
  isOverdue,
  isDueToday,
  formatDateVN,
  todoTypeBadgeClass,
  todayStr,
  ICON_OPTIONS,
  ACCENT_OPTIONS
} from "../utils/todo";

const TABLE = "congviec";
const TYPE_TABLE = "loaicongviec";
const STATUS_FILTERS = [
  { key: "chua-xong", label: "Chưa xong" },
  { key: "hoan-thanh", label: "Hoàn thành" },
  { key: "tat-ca", label: "Tất cả" },
];

function emptyForm(defaultType) {
  return { tieuDe: "", loai: defaultType, hanNgay: "", hanGio: "", moTa: "" };
}

function CongViec() {
  const configured = isConfigured();

  const { data: rows, isLoading, error: queryError, refetch } = useGetRowsQuery(TABLE, { skip: !configured });
  const { data: customTypeRows } = useGetRowsQuery(TYPE_TABLE, { skip: !configured });
  const error = queryError?.message;

  const [createRowMutation] = useCreateRowMutation();
  const [updateRowMutation] = useUpdateRowMutation();
  const [deleteRowMutation] = useDeleteRowMutation();

  const allTypes = useMemo(() => combineTodoTypes(customTypeRows), [customTypeRows]);

  const [statusFilter, setStatusFilter] = useState("chua-xong");
  const [typeFilter, setTypeFilter] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState(() => emptyForm(allTypes[0]?.key));
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [typeManagerOpen, setTypeManagerOpen] = useState(false);
  const [typeManagerForForm, setTypeManagerForForm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const sorted = useMemo(() => sortTodos(rows), [rows]);

  const filtered = useMemo(() => {
    return sorted
      .filter((t) => {
        if (statusFilter === "chua-xong") return !t.hoanThanh;
        if (statusFilter === "hoan-thanh") return Boolean(t.hoanThanh);
        return true;
      })
      .filter((t) => !typeFilter || t.loai === typeFilter);
  }, [sorted, statusFilter, typeFilter]);

  const overdueCount = useMemo(() => sorted.filter((t) => isOverdue(t)).length, [sorted]);

  const openCreate = () => {
    setEditingRow(null);
    setFormData(emptyForm(allTypes[0]?.key));
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    setFormData({
      tieuDe: row.tieuDe || "",
      loai: row.loai || allTypes[0]?.key,
      hanNgay: row.hanNgay || "",
      hanGio: row.hanGio || "",
      moTa: row.moTa || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tieuDe.trim()) {
      setFormError("Nhập tiêu đề công việc.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const data = {
        tieuDe: formData.tieuDe.trim(),
        loai: formData.loai,
        hanNgay: formData.hanNgay,
        hanGio: formData.hanNgay ? formData.hanGio : "",
        moTa: formData.moTa.trim(),
      };
      if (editingRow) {
        await updateRowMutation({ table: TABLE, id: editingRow.id, data }).unwrap();
      } else {
        await createRowMutation({ table: TABLE, data: { ...data, hoanThanh: false } }).unwrap();
      }
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingRow) return;
    setConfirmConfig({
      isOpen: true,
      title: "Xoá việc",
      message: `Bạn có chắc chắn muốn xoá việc "${editingRow.tieuDe}"?`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setDeleting(true);
        try {
          await deleteRowMutation({ table: TABLE, id: editingRow.id }).unwrap();
          setIsFormOpen(false);
          setConfirmConfig(null);
        } catch (err) {
          window.alert(err.message);
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        } finally {
          setDeleting(false);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const toggleDone = async (row) => {
    setTogglingId(row.id);
    try {
      await updateRowMutation({ table: TABLE, id: row.id, data: { hoanThanh: !row.hoanThanh } }).unwrap();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const openTypeManager = (forForm) => {
    setTypeManagerForForm(forForm);
    setTypeManagerOpen(true);
  };

  const handleTypeCreated = (newType) => {
    if (typeManagerForForm) setFormData((prev) => ({ ...prev, loai: newType.id }));
  };

  const handleTypeDeleted = (deletedId) => {
    if (typeFilter === deletedId) setTypeFilter(null);
    if (formData.loai === deletedId) setFormData((prev) => ({ ...prev, loai: allTypes[0]?.key }));
  };

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border bg-transparent px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Việc cần làm
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Việc cần làm
        </h1>
        <p className="max-w-xl text-base text-text-muted sm:text-lg">
          Ghi chú công việc, đặt hạn chót và theo dõi tiến độ. Việc có hạn sẽ hiện luôn trên Lịch.
        </p>
      </header>

      {!configured ? (
        <NotConfiguredNotice />
      ) : (
        <main className="mt-10 flex flex-col gap-5">
          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-center text-sm text-rose-200">
              {error}{" "}
              <button onClick={refetch} className="ml-2 font-semibold underline">
                Thử lại
              </button>
            </div>
          )}

          {overdueCount > 0 && (
            <div className="mx-auto flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
              Có {overdueCount} việc đã quá hạn.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-border bg-surface p-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    statusFilter === f.key ? "bg-primary-500 text-white shadow-md" : "text-text-base hover:bg-surface-hover hover:text-text-base"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Thêm việc
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setTypeFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === null
                  ? "border-white/30 bg-primary-500 text-white shadow-md"
                  : "border-border text-text-muted hover:bg-surface-hover hover:text-text-base"
              }`}
            >
              Tất cả loại
            </button>
            {allTypes.map((t) => {
              const Icon = getTypeIcon(t.icon);
              return (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter((prev) => (prev === t.key ? null : t.key))}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    typeFilter === t.key ? todoTypeBadgeClass(t.key, customTypeRows) : "border-border text-text-muted hover:bg-surface-hover hover:text-text-base"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {t.label}
                </button>
              );
            })}
            <button
              onClick={() => openTypeManager(false)}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
            >
              <Settings2 className="h-3.5 w-3.5" strokeWidth={2} />
              Quản lý loại
            </button>
          </div>

          {isLoading ? (
            <LoadingState emoji="📌" />
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-border bg-transparent px-6 py-12 text-center text-text-muted">
              Không có việc nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((row) => (
                <TodoItem
                  key={row.id}
                  row={row}
                  customTypes={customTypeRows}
                  onToggle={() => toggleDone(row)}
                  toggling={togglingId === row.id}
                  onEdit={() => openEdit(row)}
                />
              ))}
            </ul>
          )}
        </main>
      )}

      {isFormOpen && (
        <TodoFormModal
          formData={formData}
          setFormData={setFormData}
          allTypes={allTypes}
          customTypes={customTypeRows}
          onAddType={() => openTypeManager(true)}
          onSubmit={handleSubmit}
          onClose={closeForm}
          onDelete={editingRow ? handleDelete : null}
          saving={saving}
          deleting={deleting}
          error={formError}
          isEditing={Boolean(editingRow)}
        />
      )}

      {typeManagerOpen && (
        <TypeManagerModal
          customTypes={customTypeRows || []}
          onClose={() => setTypeManagerOpen(false)}
          onCreated={handleTypeCreated}
          onDeleted={handleTypeDeleted}
          createRowMutation={createRowMutation}
          deleteRowMutation={deleteRowMutation}
        />
      )}
    </>
  );
}

function TodoItem({ row, customTypes, onToggle, toggling, onEdit }) {
  const type = getTodoType(row.loai, customTypes);
  const Icon = getTypeIcon(type.icon);
  const overdue = isOverdue(row);
  const dueToday = !row.hoanThanh && isDueToday(row);

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border bg-surface p-4 backdrop-blur-xl transition-colors ${
        overdue ? "border-rose-400/30" : "border-border"
      } ${row.hoanThanh ? "opacity-60" : ""}`}
    >
      <button
        onClick={onToggle}
        disabled={toggling}
        aria-label={row.hoanThanh ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
          row.hoanThanh
            ? "border-primary-400 bg-primary-400/90 text-bg-base"
            : "border-border text-transparent hover:border-primary-400/60"
        } disabled:opacity-50`}
      >
        {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      <button onClick={onEdit} className="flex flex-1 flex-col gap-1.5 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm font-medium text-text-base ${row.hoanThanh ? "line-through" : ""}`}>{row.tieuDe}</span>
          <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${todoTypeBadgeClass(row.loai, customTypes)}`}>
            <Icon className="h-3 w-3" strokeWidth={2} />
            {type.label}
          </span>
          {overdue && (
            <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[11px] font-medium text-rose-300">
              Quá hạn
            </span>
          )}
          {dueToday && !overdue && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              Hôm nay
            </span>
          )}
        </div>
        {row.hanNgay && (
          <span className="text-xs text-text-muted">
            Hạn: {formatDateVN(row.hanNgay)}
            {row.hanGio ? ` lúc ${row.hanGio}` : ""}
          </span>
        )}
        {row.moTa && <span className="text-sm text-text-base">{row.moTa}</span>}
      </button>

      <Pencil className="mt-1 h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
    </li>
  );
}

function TodoFormModal({ formData, setFormData, allTypes, customTypes, onAddType, onSubmit, onClose, onDelete, saving, deleting, error, isEditing }) {
  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-bg-base/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-text-base">{isEditing ? "Sửa việc" : "Thêm việc"}</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-text-base">
            Tiêu đề
            <input
              type="text"
              value={formData.tieuDe}
              onChange={(e) => setField("tieuDe", e.target.value)}
              autoFocus
              className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm text-text-base">
            Loại công việc
            <div className="flex flex-wrap gap-2">
              {allTypes.map((t) => {
                const Icon = getTypeIcon(t.icon);
                return (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setField("loai", t.key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      formData.loai === t.key ? todoTypeBadgeClass(t.key, customTypes) : "border-border text-text-muted hover:bg-surface-hover hover:text-text-base"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {t.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onAddType}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Loại mới
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-1 flex-col gap-1.5 text-sm text-text-base">
              Hạn ngày
              <input
                type="date"
                value={formData.hanNgay}
                min={todayStr()}
                onChange={(e) => setField("hanNgay", e.target.value)}
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-sm text-text-base">
              Hạn giờ (không bắt buộc)
              <input
                type="time"
                value={formData.hanGio}
                disabled={!formData.hanNgay}
                onChange={(e) => setField("hanGio", e.target.value)}
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50 disabled:opacity-40"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm text-text-base">
            Mô tả (không bắt buộc)
            <textarea
              value={formData.moTa}
              onChange={(e) => setField("moTa", e.target.value)}
              rows={3}
              className="resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
            />
          </label>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <div className="mt-2 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-400/10 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Xoá
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TypeManagerModal({ customTypes, onClose, onCreated, onDeleted, createRowMutation, deleteRowMutation }) {
  const [ten, setTen] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [mauSac, setMauSac] = useState(ACCENT_OPTIONS[0]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ten.trim()) {
      setError("Nhập tên loại công việc.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createRowMutation({ table: TYPE_TABLE, data: { ten: ten.trim(), icon, mauSac } }).unwrap();
      setTen("");
      setIcon(ICON_OPTIONS[0]);
      setMauSac(ACCENT_OPTIONS[0]);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xoá loại công việc",
      message: `Xoá loại "${row.ten}"? Các việc đang dùng loại này sẽ chuyển về "Khác".`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setDeletingId(row.id);
        try {
          await deleteRowMutation({ table: TYPE_TABLE, id: row.id }).unwrap();
          onDeleted(row.id);
          setConfirmConfig(null);
        } catch (err) {
          window.alert(err.message);
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        } finally {
          setDeletingId(null);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-bg-base/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-base">Quản lý loại công việc</h2>
            <p className="mt-1 text-sm text-text-muted">Tự thêm loại công việc riêng kèm icon và màu.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {customTypes.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2">
            {customTypes.map((row) => {
              const Icon = getTypeIcon(row.icon);
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-transparent px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-text-base">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${accentSoftClass(row.mauSac)} ${accentTextClass(row.mauSac)}`}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    {row.ten}
                  </span>
                  <button
                    onClick={() => handleDelete(row)}
                    disabled={deletingId === row.id}
                    aria-label="Xoá loại"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
                  >
                    {deletingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 border-t border-border pt-5">
          <label className="flex flex-col gap-1.5 text-sm text-text-base">
            Tên loại mới
            <input
              type="text"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              placeholder="Vd: Thi đua, Trực trường,..."
              autoFocus
              className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm text-text-base">
            Icon
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((key) => {
                const Icon = getTypeIcon(key);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setIcon(key)}
                    aria-label={key}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                      icon === key ? "border-primary-400/60 bg-primary-400/10 text-primary-300" : "border-border text-text-muted hover:bg-surface-hover hover:text-text-base"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-text-base">
            Màu
            <div className="flex flex-wrap gap-2">
              {ACCENT_OPTIONS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setMauSac(a)}
                  aria-label={a}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${accentSwatchClass(a)} transition-transform ${
                    mauSac === a ? "scale-110 ring-2 ring-white/70 ring-offset-2 ring-offset-slate-900" : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <div className="mt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
              Thêm loại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NotConfiguredNotice() {
  return (
    <div className="mt-10 rounded-3xl border border-amber-400/25 bg-amber-400/5 px-6 py-8 text-center text-text-base">
      <p className="font-semibold text-amber-200">Chưa kết nối được với Google Sheet.</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">
        Cần cấu hình <code className="rounded bg-black/30 px-1.5 py-0.5">VITE_APPS_SCRIPT_URL</code> và{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5">VITE_APPS_SCRIPT_TOKEN</code> trong file{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5">.env</code>. Xem hướng dẫn đầy đủ trong{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5">apps-script/README.md</code>.
      </p>
    </div>
  );
}

export default CongViec;
