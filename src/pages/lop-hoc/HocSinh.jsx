import { Fragment, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Search, Eye, EyeOff, Columns3 } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import { isConfigured } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";
import { normalizeText } from "../../utils/text";

const TABLE = "hocsinh";
const HIDDEN_STORAGE_KEY = "hocsinh_hidden_rows";
const COLUMN_STORAGE_KEY = "hocsinh_visible_columns";
const LONG_PRESS_MS = 450;

const SEARCH_FIELDS = [
  { key: "hoVaTen", label: "Họ và tên" },
  { key: "ngaySinh", label: "Ngày sinh" },
  { key: "gioiTinh", label: "Giới tính" },
  { key: "danToc", label: "Dân tộc" },
  { key: "noiSinh", label: "Nơi sinh" },
  { key: "hoTenCha", label: "Họ tên cha" },
  { key: "hoTenMe", label: "Họ tên mẹ" },
  { key: "noiCuTru", label: "Nơi cư trú" },
];

// Some rows synced straight from an existing Google Sheet have no "id" yet
// (that column is only populated for rows created through this app), so fall
// back to a natural key to keep row selection/hide state from colliding.
function getRowKey(row) {
  return row.id || `${row.hoVaTen}__${row.ngaySinh}`;
}

const FIELDS = [
  { key: "hoVaTen", label: "Họ và tên học sinh", type: "text" },
  { key: "ngaySinh", label: "Ngày, tháng, năm sinh", type: "date" },
  { key: "gioiTinh", label: "Giới tính", type: "select", options: ["Nam", "Nữ"] },
  { key: "danToc", label: "Dân tộc", type: "text" },
  { key: "noiSinh", label: "Nơi sinh (tên tỉnh)", type: "text" },
  { key: "hoTenCha", label: "Họ tên cha", type: "text" },
  { key: "hoTenMe", label: "Họ tên mẹ", type: "text" },
  { key: "noiCuTru", label: "Nơi cư trú (Ấp, xã)", type: "text" },
  { key: "hsNoiTru", label: "HS nội trú", type: "checkbox" },
  { key: "hsBanTru", label: "HS bán trú buổi trưa", type: "checkbox" },
];

const TABLE_COLUMNS = [
  { key: "stt", label: "Stt" },
  { key: "hoVaTen", label: "Họ và tên học sinh" },
  { key: "ngaySinh", label: "Ngày sinh" },
  { key: "gioiTinh", label: "Giới tính" },
  { key: "danToc", label: "Dân tộc" },
  { key: "noiSinh", label: "Nơi sinh" },
  { key: "hoTenCha", label: "Họ tên cha" },
  { key: "hoTenMe", label: "Họ tên mẹ" },
  { key: "noiCuTru", label: "Nơi cư trú" },
  { key: "hsNoiTru", label: "Nội trú" },
  { key: "hsBanTru", label: "Bán trú" },
];

// "stt" (row number) is always shown; only the rest can be toggled off.
const TOGGLEABLE_COLUMNS = TABLE_COLUMNS.filter((col) => col.key !== "stt");
const DEFAULT_VISIBLE_COLUMNS = TOGGLEABLE_COLUMNS.map((col) => col.key);

function emptyForm() {
  const form = {};
  FIELDS.forEach((f) => {
    form[f.key] = f.type === "checkbox" ? false : "";
  });
  return form;
}

function HocSinh() {
  const configured = isConfigured();

  const {
    data: rows,
    isLoading,
    error: queryError,
    refetch,
  } = useGetRowsQuery(TABLE, { skip: !configured });
  const error = queryError?.message;

  const [createRowMutation] = useCreateRowMutation();
  const [updateRowMutation] = useUpdateRowMutation();
  const [deleteRowMutation] = useDeleteRowMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("hoVaTen");
  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showHidden, setShowHidden] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((key) => DEFAULT_VISIBLE_COLUMNS.includes(key));
      }
    } catch {
      // ignore malformed storage
    }
    return DEFAULT_VISIBLE_COLUMNS;
  });
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);


  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hiddenIds));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [hiddenIds]);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [visibleColumns]);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (!e.target.closest("[data-hocsinh-row]")) {
        setSelectedRowId(null);
      }
      if (!e.target.closest("[data-column-menu]")) {
        setColumnMenuOpen(false);
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      if (prev.includes(key)) {
        const next = prev.filter((k) => k !== key);
        return next.length > 0 ? next : prev;
      }
      return [...prev, key];
    });
  };

  const toggleHidden = (id) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleRowClick = (id) => {
    setSelectedRowId((prev) => (prev === id ? null : id));
  };

  const openAddForm = () => {
    setEditingRow(null);
    setFormData(emptyForm());
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (row) => {
    setEditingRow(row);
    setFormData({ ...emptyForm(), ...row });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingRow) {
        await updateRowMutation({ table: TABLE, id: editingRow.id, data: formData }).unwrap();
      } else {
        await createRowMutation({ table: TABLE, data: formData }).unwrap();
      }
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xoá học sinh "${row.hoVaTen}"?`)) return;
    setDeletingId(row.id);
    try {
      await deleteRowMutation({ table: TABLE, id: row.id }).unwrap();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const normalizedSearch = normalizeText(searchTerm);
  const filteredRows = (rows || [])
    .filter((row) => showHidden || !hiddenIds.includes(getRowKey(row)))
    .filter((row) => !normalizedSearch || normalizeText(row[searchField]).includes(normalizedSearch));

  const displayColumns = TABLE_COLUMNS.filter(
    (col) => col.key === "stt" || visibleColumns.includes(col.key)
  );

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border bg-transparent px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Quản lý học sinh
        </h1>
      </header>

      <div className="mt-8">
        <LopHocTabs />
      </div>

      {!configured ? (
        <NotConfiguredNotice />
      ) : (
        <main className="mt-10 flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-center gap-1 rounded-full border border-border bg-surface pl-2 pr-1 sm:max-w-md">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                aria-label="Tìm theo tiêu chí"
                className="shrink-0 rounded-full bg-transparent py-2 pl-2 pr-1 text-xs font-medium text-text-base outline-none"
              >
                {SEARCH_FIELDS.map((f) => (
                  <option key={f.key} value={f.key} className="bg-bg-base text-text-base">
                    {f.label}
                  </option>
                ))}
              </select>
              <span className="h-4 w-px shrink-0 bg-surface-hover" />
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Tìm theo ${SEARCH_FIELDS.find((f) => f.key === searchField)?.label.toLowerCase()}...`}
                  className="w-full bg-transparent py-2 pl-8 pr-3 text-sm text-text-base outline-none placeholder:text-text-muted"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <div className="relative" data-column-menu>
                <button
                  onClick={() => setColumnMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-hover"
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  Cột hiển thị
                </button>
                {columnMenuOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-bg-base/95 p-3 shadow-2xl backdrop-blur-xl">
                    <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Chọn cột hiển thị
                    </p>
                    <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                      {TOGGLEABLE_COLUMNS.map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-text-base hover:bg-surface"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            className="h-4 w-4 rounded border-border bg-surface accent-emerald-400"
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {hiddenIds.length > 0 && (
                <button
                  onClick={() => setShowHidden((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-hover"
                >
                  {showHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showHidden ? "Ẩn danh sách đã ẩn" : `Hiện ${hiddenIds.length} học sinh đã ẩn`}
                </button>
              )}
              <button
                onClick={openAddForm}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base transition-transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Thêm học sinh
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
              {error}{" "}
              <button onClick={refetch} className="ml-2 font-semibold underline">
                Thử lại
              </button>
            </div>
          )}

          {isLoading ? (
            <LoadingState emoji="📚" />
          ) : rows && rows.length === 0 ? (
            <div className="rounded-3xl border border-border bg-transparent px-6 py-16 text-center text-text-muted">
              Chưa có học sinh nào. Bấm "Thêm học sinh" để bắt đầu.
            </div>
          ) : rows && filteredRows.length === 0 ? (
            <div className="rounded-3xl border border-border bg-transparent px-6 py-16 text-center text-text-muted">
              Không tìm thấy học sinh phù hợp.
            </div>
          ) : rows && filteredRows.length > 0 ? (
            <div className="overflow-x-auto rounded-3xl border border-border bg-surface backdrop-blur-xl">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                    {displayColumns.map((col) => (
                      <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const rowKey = getRowKey(row);
                    const isHidden = hiddenIds.includes(rowKey);
                    const isSelected = selectedRowId === rowKey;
                    return (
                      <Fragment key={rowKey}>
                        <tr
                          data-hocsinh-row
                          onClick={() => handleRowClick(rowKey)}
                          className={`cursor-pointer select-none border-b border-border last:border-0 hover:bg-surface ${
                            isHidden ? "opacity-40" : ""
                          } ${isSelected ? "bg-surface-hover" : ""}`}
                        >
                          {displayColumns.map((col) => (
                            <td key={col.key} className="whitespace-nowrap px-4 py-3 text-text-base">
                              {col.key === "hsNoiTru" || col.key === "hsBanTru" ? (
                                row[col.key] ? (
                                  <span className="text-primary-300">✓</span>
                                ) : (
                                  <span className="text-text-muted">–</span>
                                )
                              ) : (
                                row[col.key] || "—"
                              )}
                            </td>
                          ))}
                        </tr>
                        {isSelected && (
                          <tr data-hocsinh-row className="border-b border-border bg-surface last:border-0">
                            <td colSpan={displayColumns.length} className="px-4 py-2">
                              <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-2">
                                <button
                                  onClick={() => openEditForm(row)}
                                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-text-base transition-colors hover:bg-surface-hover sm:rounded-full"
                                >
                                  <Pencil className="h-4 w-4" strokeWidth={2} />
                                  Sửa
                                </button>
                                <button
                                  onClick={() => toggleHidden(rowKey)}
                                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-text-base transition-colors hover:bg-surface-hover sm:rounded-full"
                                >
                                  {isHidden ? (
                                    <Eye className="h-4 w-4" strokeWidth={2} />
                                  ) : (
                                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                                  )}
                                  {isHidden ? "Bỏ ẩn" : "Ẩn"}
                                </button>
                                <button
                                  onClick={() => handleDelete(row)}
                                  disabled={deletingId === row.id}
                                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-rose-400/20 disabled:opacity-50 sm:rounded-full"
                                >
                                  {deletingId === row.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                                  )}
                                  Xoá
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </main>
      )}

      {isFormOpen && (
        <StudentFormModal
          fields={FIELDS}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={closeForm}
          saving={saving}
          error={formError}
          isEditing={Boolean(editingRow)}
        />
      )}
    </>
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

function StudentFormModal({ fields, formData, setFormData, onSubmit, onClose, saving, error, isEditing }) {
  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-bg-base/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-base">
            {isEditing ? "Sửa thông tin học sinh" : "Thêm học sinh"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields
              .filter((f) => f.type !== "checkbox")
              .map((field) => (
                <label key={field.key} className="flex flex-col gap-1.5 text-sm text-text-base">
                  {field.label}
                  {field.type === "select" ? (
                    <select
                      value={formData[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
                    >
                      <option value="" className="bg-bg-base">
                        Chọn...
                      </option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt} className="bg-bg-base">
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
                    />
                  )}
                </label>
              ))}
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            {fields
              .filter((f) => f.type === "checkbox")
              .map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm text-text-base">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field.key])}
                    onChange={(e) => setField(field.key, e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-surface accent-emerald-400"
                  />
                  {field.label}
                </label>
              ))}
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
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
        </form>
      </div>
    </div>
  );
}

export default HocSinh;
