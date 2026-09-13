import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, X, Pin, PinOff, Search } from "lucide-react";
import LoadingState from "../components/LoadingState";
import ConfirmModal from "../components/ConfirmModal";
import { isConfigured } from "../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../store/sheetApi";
import { normalizeText } from "../utils/text";

const TABLE = "ghichu";

const COLORS = [
  { value: "bg-surface border-border", label: "Mặc định" },
  { value: "bg-rose-400/10 border-rose-400/20", label: "Đỏ" },
  { value: "bg-amber-400/10 border-amber-400/20", label: "Vàng" },
  { value: "bg-emerald-400/10 border-emerald-400/20", label: "Xanh lá" },
  { value: "bg-blue-400/10 border-blue-400/20", label: "Xanh dương" },
  { value: "bg-indigo-400/10 border-indigo-400/20", label: "Chàm" },
  { value: "bg-fuchsia-400/10 border-fuchsia-400/20", label: "Tím" },
];

function emptyForm() {
  return { tieuDe: "", noiDung: "", mauSac: COLORS[0].value, ghim: false };
}

function GhiChu() {
  const configured = isConfigured();

  const { data: rows, isLoading, error: queryError, refetch } = useGetRowsQuery(TABLE, { skip: !configured });
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
  const [togglingPinId, setTogglingPinId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!rows) return [];
    let result = [...rows];
    
    if (search.trim()) {
      const q = normalizeText(search.trim());
      result = result.filter(n => 
        normalizeText(n.tieuDe || "").includes(q) || 
        normalizeText(n.noiDung || "").includes(q)
      );
    }
    
    // Sort: Pinned first, then newest first
    result.sort((a, b) => {
      if (a.ghim && !b.ghim) return -1;
      if (!a.ghim && b.ghim) return 1;
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
    
    return result;
  }, [rows, search]);

  const openCreate = () => {
    setEditingRow(null);
    setFormData(emptyForm());
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    setFormData({
      tieuDe: row.tieuDe || "",
      noiDung: row.noiDung || "",
      mauSac: row.mauSac || COLORS[0].value,
      ghim: row.ghim || false
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRow(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.noiDung.trim()) {
      setFormError("Vui lòng nhập nội dung ghi chú");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const dataToSave = { ...formData, updatedAt: new Date().toISOString() };
      
      if (editingRow) {
        await updateRowMutation({ table: TABLE, id: editingRow.id, data: dataToSave }).unwrap();
      } else {
        dataToSave.createdAt = new Date().toISOString();
        await createRowMutation({ table: TABLE, data: dataToSave }).unwrap();
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (e, row) => {
    e.stopPropagation();
    setTogglingPinId(row.id);
    try {
      await updateRowMutation({ table: TABLE, id: row.id, data: { ghim: !row.ghim, updatedAt: new Date().toISOString() } }).unwrap();
    } catch (err) {
      window.alert("Lỗi khi ghim: " + err.message);
    } finally {
      setTogglingPinId(null);
    }
  };

  const handleDelete = (e, row) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Xoá ghi chú",
      message: `Bạn có chắc chắn muốn xoá ghi chú này?`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setDeletingId(row.id);
        try {
          await deleteRowMutation({ table: TABLE, id: row.id }).unwrap();
          setConfirmConfig(null);
        } catch (err) {
          window.alert(err.message);
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        } finally {
          setDeletingId(null);
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  return (
    <>
      <ConfirmModal {...confirmConfig} />

      <header className="mb-8 rounded-3xl bg-gradient-to-br from-text-base to-primary-500 p-8 text-bg-base shadow-lg sm:mb-12">
        <h1 className="text-3xl font-bold">Ghi chú</h1>
        <p className="mt-2 text-bg-base/80">Không gian lưu trữ nhanh mọi ý tưởng và thông tin.</p>
      </header>

      {!configured ? (
        <NotConfiguredNotice />
      ) : (
        <main>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm ghi chú..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-base outline-none transition-colors focus:border-primary-500"
              />
            </div>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-6 py-2.5 font-medium text-white shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 hover:shadow-primary-500/40 active:translate-y-0 active:shadow-md"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              Thêm ghi chú
            </button>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/25 bg-rose-400/5 px-6 py-8 text-center text-rose-400">
              <p>{error}</p>
              <button onClick={refetch} className="mt-4 text-sm font-medium hover:underline">
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface-hover/30 px-4 text-center">
              <p className="text-text-muted">Chưa có ghi chú nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(row => (
                <div 
                  key={row.id}
                  onClick={() => openEdit(row)}
                  className={`group relative flex cursor-pointer flex-col rounded-3xl border ${row.mauSac || COLORS[0].value} p-5 transition-all hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-text-base line-clamp-2 leading-tight">
                      {row.tieuDe || <span className="text-text-muted italic">Không tiêu đề</span>}
                    </h3>
                    <button
                      onClick={(e) => togglePin(e, row)}
                      disabled={togglingPinId === row.id}
                      className={`shrink-0 p-1 rounded-full transition-colors ${row.ghim ? 'text-amber-500 hover:bg-amber-500/10' : 'text-text-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-text-base hover:bg-surface-hover'}`}
                    >
                      {togglingPinId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (row.ghim ? <Pin className="h-4 w-4 fill-current" /> : <Pin className="h-4 w-4" />)}
                    </button>
                  </div>
                  
                  <p className="whitespace-pre-wrap text-sm text-text-muted line-clamp-6 mb-4 flex-1">
                    {row.noiDung}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pt-4 border-t border-text-muted/10">
                    <span className="text-xs text-text-muted">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={(e) => handleDelete(e, row)} disabled={deletingId === row.id} className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                        {deletingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-bg-base shadow-2xl transition-colors`}>
            <div className={`flex items-center justify-between border-b border-border/50 px-6 py-4 ${formData.mauSac}`}>
              <h2 className="text-lg font-semibold text-text-base">
                {editingRow ? "Sửa ghi chú" : "Thêm ghi chú mới"}
              </h2>
              <button onClick={closeForm} className="rounded-full p-2 text-text-muted hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-6 rounded-xl border border-rose-400/25 bg-rose-400/5 px-4 py-3 text-sm text-rose-400">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={formData.tieuDe}
                    onChange={(e) => setFormData(prev => ({ ...prev, tieuDe: e.target.value }))}
                    placeholder="Tiêu đề..."
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-base font-semibold text-text-base outline-none focus:border-primary-400/50"
                  />
                </div>
                
                <div>
                  <textarea
                    value={formData.noiDung}
                    onChange={(e) => setFormData(prev => ({ ...prev, noiDung: e.target.value }))}
                    placeholder="Nội dung ghi chú..."
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-base outline-none focus:border-primary-400/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-muted">Màu nền</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, mauSac: c.value }))}
                        className={`h-8 w-8 rounded-full border-2 ${c.value.split(' ')[0]} ${formData.mauSac === c.value ? 'border-text-base ring-2 ring-text-base/20 ring-offset-2 ring-offset-bg-base' : 'border-transparent'}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-2xl px-5 py-2.5 text-sm font-medium text-text-muted hover:text-text-base"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function NotConfiguredNotice() {
  return (
    <div className="mt-10 rounded-3xl border border-amber-400/25 bg-amber-400/5 px-6 py-8 text-center text-text-base">
      <p className="font-semibold text-amber-200">Chưa kết nối được với Google Sheet.</p>
    </div>
  );
}

export default GhiChu;
