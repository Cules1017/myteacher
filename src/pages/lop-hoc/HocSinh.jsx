import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { isConfigured, listRows, createRow, updateRow, deleteRow } from "../../services/sheetApi";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";

const TABLE = "hocsinh";

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

function emptyForm() {
  const form = {};
  FIELDS.forEach((f) => {
    form[f.key] = f.type === "checkbox" ? false : "";
  });
  return form;
}

function HocSinh() {
  const configured = isConfigured();

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const refresh = () => {
    setError(null);
    listRows(TABLE)
      .then(setRows)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (configured) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

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
        await updateRow(TABLE, editingRow.id, formData);
      } else {
        await createRow(TABLE, formData);
      }
      refresh();
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
      await deleteRow(TABLE, row.id);
      refresh();
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
          <div className="flex justify-end">
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Thêm học sinh
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
              {error}{" "}
              <button onClick={refresh} className="ml-2 font-semibold underline">
                Thử lại
              </button>
            </div>
          )}

          {rows === null && !error ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải danh sách học sinh...
            </div>
          ) : rows && rows.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-400">
              Chưa có học sinh nào. Bấm "Thêm học sinh" để bắt đầu.
            </div>
          ) : rows && rows.length > 0 ? (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                    {TABLE_COLUMNS.map((col) => (
                      <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                      {TABLE_COLUMNS.map((col) => (
                        <td key={col.key} className="whitespace-nowrap px-4 py-3 text-slate-200">
                          {col.key === "hsNoiTru" || col.key === "hsBanTru" ? (
                            row[col.key] ? (
                              <span className="text-emerald-300">✓</span>
                            ) : (
                              <span className="text-slate-600">–</span>
                            )
                          ) : (
                            row[col.key] || "—"
                          )}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(row)}
                            aria-label="Sửa"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
                            aria-label="Xoá"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
                          >
                            {deletingId === row.id ? (
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
    <div className="mt-10 rounded-3xl border border-amber-400/25 bg-amber-400/5 px-6 py-8 text-center text-slate-300">
      <p className="font-semibold text-amber-200">Chưa kết nối được với Google Sheet.</p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? "Sửa thông tin học sinh" : "Thêm học sinh"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields
              .filter((f) => f.type !== "checkbox")
              .map((field) => (
                <label key={field.key} className="flex flex-col gap-1.5 text-sm text-slate-300">
                  {field.label}
                  {field.type === "select" ? (
                    <select
                      value={formData[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400/50"
                    >
                      <option value="" className="bg-slate-900">
                        Chọn...
                      </option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt} className="bg-slate-900">
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400/50"
                    />
                  )}
                </label>
              ))}
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            {fields
              .filter((f) => f.type === "checkbox")
              .map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field.key])}
                    onChange={(e) => setField(field.key, e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-emerald-400"
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
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
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
