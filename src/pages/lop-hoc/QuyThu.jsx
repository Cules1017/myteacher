import { useState, useMemo } from "react";
import { Plus, Trash2, Loader2, Edit2, Check, X, Search, CheckCheck, ChevronLeft, Save } from "lucide-react";
import { isConfigured } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingState from "../../components/LoadingState";

function formatVND(amount) {
  if (amount == null || amount === "") return "";
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function MoneyInput({ value, onChange, placeholder, wrapperClassName = "", inputClassName = "", align = "left" }) {
  const [show, setShow] = useState(false);
  const rawValue = String(value).replace(/\D/g, "");

  const suggestions = useMemo(() => {
    if (!rawValue || rawValue === "0") return [];
    const base = Number(rawValue);
    if (base >= 10000000) return [];
    return [base * 1000, base * 10000, base * 100000, base * 1000000].filter(v => v < 1000000000);
  }, [rawValue]);

  return (
    <div className={`relative flex-shrink-0 ${wrapperClassName}`} 
         onBlur={(e) => {
           if (!e.currentTarget.contains(e.relatedTarget)) {
             setShow(false);
           }
         }}>
      <input
        type="text"
        value={rawValue === "" ? "" : formatVND(rawValue)}
        onChange={(e) => {
          onChange(e.target.value.replace(/\D/g, ""));
          setShow(true);
        }}
        onFocus={() => {
           if (rawValue) setShow(true);
        }}
        placeholder={placeholder}
        className={inputClassName}
      />
      {show && suggestions.length > 0 && (
        <div className={`absolute top-full mt-2 w-max min-w-full bg-surface-hover border border-border rounded-xl shadow-2xl overflow-hidden z-[60] ${align === "right" ? "right-0" : "left-0"}`}>
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              className={`w-full ${align === "right" ? "text-right" : "text-left"} px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0`}
              onClick={() => {
                onChange(String(s));
                setShow(false);
              }}
            >
              {formatVND(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentPaymentRow({ student, payment, column, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEdit = () => {
    setAmount(payment?.soTien || column.mucThu);
    setNote(payment?.ghiChu || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Number(String(amount).replace(/\D/g, "")), note);
      setIsEditing(false);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const [confirmConfig, setConfirmConfig] = useState(null);

  const handleDelete = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Xoá dữ liệu",
      message: `Xoá dữ liệu đóng của ${student.hoVaTen}?`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setDeleting(true);
        try {
          await onDelete(payment.id);
          setConfirmConfig(null);
        } catch (e) {
          window.alert(e.message);
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        } finally {
          setDeleting(false);
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  const handleDongDu = async () => {
    setSaving(true);
    try {
      await onSave(Number(column.mucThu), payment?.ghiChu || "");
    } catch (e) {
      window.alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ConfirmModal {...confirmConfig} />
      <div className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-surface transition-colors group">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface text-text-muted text-sm font-medium">
          {student.stt}
        </div>
        <div className="font-medium text-text-base">{student.hoVaTen}</div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <MoneyInput
              value={amount}
              onChange={setAmount}
              placeholder="Số tiền"
              wrapperClassName="w-24"
              inputClassName="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-right text-sm text-text-base outline-none focus:border-primary-400/50"
              align="right"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú..."
              className="w-32 rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm text-text-base outline-none focus:border-primary-400/50"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-400/10 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-hover disabled:opacity-50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : payment ? (
          <>
            <div className="flex flex-col items-end">
              <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                Đã đóng {formatVND(payment.soTien)}đ
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted">
                  {payment.ghiChu ? payment.ghiChu : (payment.timestamp ? `lúc ${new Date(payment.timestamp).toLocaleString("vi-VN")}` : "")}
                </span>
                {payment.ghiChu && payment.timestamp && (
                   <span className="text-[10px] text-text-muted">({new Date(payment.timestamp).toLocaleString("vi-VN")})</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={startEdit}
                className="p-2 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-hover transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 rounded-lg text-text-muted hover:text-rose-600 dark:text-rose-400 hover:bg-rose-400/10 transition-colors"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-sm">Chưa đóng</span>
            <button
              onClick={handleDongDu}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-500/20 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Đóng đủ
            </button>
            <button
              onClick={startEdit}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-hover transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function QuyThu() {
  const configured = isConfigured();

  const { data: students, error: studentsError, isLoading: studentsLoading } = useGetRowsQuery("hocsinh", { skip: !configured });
  const { data: columns, error: columnsError, isLoading: columnsLoading } = useGetRowsQuery("khoanthu", { skip: !configured });
  const { data: payments, error: paymentsError, isLoading: paymentsLoading } = useGetRowsQuery("dongquy", { skip: !configured });

  const isLoading = configured && (studentsLoading || columnsLoading || paymentsLoading);
  const error = studentsError?.message || columnsError?.message || paymentsError?.message;

  const [createRow] = useCreateRowMutation();
  const [updateRow] = useUpdateRowMutation();
  const [deleteRow] = useDeleteRowMutation();

  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnAmount, setNewColumnAmount] = useState("");
  const [newColumnDeadline, setNewColumnDeadline] = useState("");
  const [savingColumn, setSavingColumn] = useState(false);
  const [deletingColumnId, setDeletingColumnId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  
  const [activeColumnId, setActiveColumnId] = useState(null);
  const [search, setSearch] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const paymentByKey = useMemo(() => {
    const map = new Map();
    (payments || []).forEach((p) => map.set(`${p.khoanThuId}__${p.hocSinhId}`, p));
    return map;
  }, [payments]);

  const activeColumn = useMemo(() => {
    return (columns || []).find(c => c.id === activeColumnId);
  }, [columns, activeColumnId]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => (s.hoVaTen || "").toLowerCase().includes(q));
  }, [students, search]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    const name = newColumnName.trim();
    const amount = Number(String(newColumnAmount).replace(/\D/g, ""));
    if (!name || !amount) return;
    
    setSavingColumn(true);
    try {
      await createRow({ 
        table: "khoanthu", 
        data: { 
          tenKhoanThu: name, 
          mucThu: amount,
          hanDong: newColumnDeadline || "" 
        } 
      }).unwrap();
      setNewColumnName("");
      setNewColumnAmount("");
      setNewColumnDeadline("");
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSavingColumn(false);
    }
  };

  const handleDeleteColumn = (column) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xoá khoản thu",
      message: `Xoá khoản thu "${column.tenKhoanThu}"? Dữ liệu đã đóng của học sinh sẽ bị xoá.`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setDeletingColumnId(column.id);
        try {
          const relatedPayments = (payments || []).filter((p) => p.khoanThuId === column.id);
          for (const p of relatedPayments) {
            await deleteRow({ table: "dongquy", id: p.id }).unwrap();
          }
          await deleteRow({ table: "khoanthu", id: column.id }).unwrap();
          if (activeColumnId === column.id) setActiveColumnId(null);
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

  const savePayment = async (column, student, value, note) => {
    const key = `${column.id}__${student.id}`;
    const existing = paymentByKey.get(key);
    const data = {
      khoanThuId: column.id,
      hocSinhId: student.id,
      hoVaTen: student.hoVaTen,
      soTien: value,
      ghiChu: note || "",
      timestamp: new Date().toISOString()
    };
    
    if (existing) {
      await updateRow({ table: "dongquy", id: existing.id, data }).unwrap();
    } else {
      await createRow({ table: "dongquy", data }).unwrap();
    }
  };

  const deletePayment = async (paymentId) => {
    await deleteRow({ table: "dongquy", id: paymentId }).unwrap();
  };

  const handleMarkAllDongDu = () => {
    if (!activeColumn || !students) return;
    setConfirmConfig({
      isOpen: true,
      title: "Đóng đủ tất cả",
      message: `Đánh dấu tất cả học sinh đã đóng đủ khoản "${activeColumn.tenKhoanThu}"?`,
      confirmText: "Xác nhận",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        setMarkingAll(true);
        try {
          for (const student of students) {
            const key = `${activeColumn.id}__${student.id}`;
            const existing = paymentByKey.get(key);
            if (!existing || Number(existing.soTien) < Number(activeColumn.mucThu)) {
               const data = {
                 khoanThuId: activeColumn.id,
                 hocSinhId: student.id,
                 hoVaTen: student.hoVaTen,
                 soTien: Number(activeColumn.mucThu),
                 ghiChu: existing?.ghiChu || "",
                 timestamp: new Date().toISOString()
               };
               if (existing) {
                 await updateRow({ table: "dongquy", id: existing.id, data }).unwrap();
               } else {
                 await createRow({ table: "dongquy", data }).unwrap();
               }
            }
          }
          setConfirmConfig(null);
        } catch (err) {
          window.alert(err.message);
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        } finally {
          setMarkingAll(false);
        }
      },
      onCancel: () => setConfirmConfig(null)
    });
  };

  return (
    <>
      <ConfirmModal {...confirmConfig} />
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border bg-transparent px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Quỹ thu
        </h1>
      </header>

      <div className="mt-8">
        <LopHocTabs />
      </div>

      {!configured ? (
        <NotConfiguredNotice />
      ) : isLoading ? (
        <LoadingState emoji="💰" />
      ) : (
        <main className="mt-10 flex flex-col gap-6">
          {error && (
            <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-center text-sm text-rose-200">
              {error}
            </div>
          )}

          {!activeColumn ? (
            // DANH SÁCH CÁC KHOẢN THU
            <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
              <form onSubmit={handleAddColumn} className="flex flex-wrap items-center gap-3 p-6 rounded-3xl border border-border bg-surface backdrop-blur-xl">
                <div className="w-full mb-1">
                  <h2 className="text-lg font-semibold text-text-base">Thêm khoản thu mới</h2>
                </div>
                <input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Tên khoản thu (vd: Quỹ lớp HKI)"
                  className="flex-1 min-w-[200px] rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
                />
                <MoneyInput
                  value={newColumnAmount}
                  onChange={setNewColumnAmount}
                  placeholder="Mức thu (VNĐ)"
                  wrapperClassName="w-32"
                  inputClassName="w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50"
                />
                <input
                  type="date"
                  value={newColumnDeadline}
                  onChange={(e) => setNewColumnDeadline(e.target.value)}
                  title="Hạn đóng (không bắt buộc)"
                  className="w-36 rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm text-text-base outline-none focus:border-primary-400/50"
                />
                <button
                  type="submit"
                  disabled={savingColumn}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-500 text-bg-base font-semibold px-5 py-2.5 text-sm transition-colors hover:bg-primary-400 disabled:opacity-60"
                >
                  {savingColumn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                  Thêm đợt thu
                </button>
              </form>

              {columns && columns.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {columns.map(c => {
                    const expected = Number(c.mucThu) * (students?.length || 0);
                    const related = (payments || []).filter(p => p.khoanThuId === c.id);
                    const actual = related.reduce((sum, p) => sum + Number(p.soTien || 0), 0);
                    const percent = expected > 0 ? Math.round((actual / expected) * 100) : 0;
                    
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => setActiveColumnId(c.id)}
                        className="group flex flex-col gap-3 p-5 rounded-3xl border border-border bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        <h3 className="font-semibold text-lg text-primary-200">{c.tenKhoanThu}</h3>
                        <div className="flex flex-col gap-1 text-sm text-text-muted">
                          <p>Mức thu: <span className="text-text-base">{formatVND(c.mucThu)}đ</span></p>
                          {c.hanDong && (
                            <p>Hạn: <span className="text-amber-200">{new Date(c.hanDong).toLocaleDateString('vi-VN')}</span></p>
                          )}
                          <p>Tiến độ: <span className="text-primary-600 dark:text-primary-400">{formatVND(actual)}đ</span> / {formatVND(expected)}đ ({percent}%)</p>
                        </div>
                        <div className="w-full bg-surface-hover rounded-full h-1.5 mt-1">
                          <div className="bg-primary-400 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">Chưa có khoản thu nào.</div>
              )}
            </div>
          ) : (
            // CHI TIẾT TỪNG KHOẢN THU (LIST VIEW)
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
              <button 
                onClick={() => setActiveColumnId(null)}
                className="flex items-center gap-1 text-sm text-text-muted hover:text-text-base transition-colors w-fit"
              >
                <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
              </button>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-primary-500/20 bg-primary-500/5 backdrop-blur-xl">
                <div>
                  <h2 className="text-xl font-bold text-primary-100">{activeColumn.tenKhoanThu}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-primary-600 dark:text-primary-400/80 text-sm">Mức thu chuẩn: {formatVND(activeColumn.mucThu)}đ / học sinh</p>
                    {activeColumn.hanDong && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <p className="text-amber-200/90 text-sm">Hạn đóng: {new Date(activeColumn.hanDong).toLocaleDateString('vi-VN')}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleMarkAllDongDu}
                    disabled={markingAll}
                    className="flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-100 dark:bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-300 transition-colors hover:bg-primary-500/20 disabled:opacity-50"
                  >
                    {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                    Đóng tất cả
                  </button>
                  <button
                    onClick={() => handleDeleteColumn(activeColumn)}
                    disabled={deletingColumnId === activeColumn.id}
                    className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-100 dark:bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    {deletingColumnId === activeColumn.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Xoá đợt thu này
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 bg-surface p-2 rounded-2xl border border-border">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm học sinh..."
                    className="w-full bg-transparent pl-9 pr-4 py-2 text-sm text-text-base outline-none placeholder:text-text-muted"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="pr-4 text-sm text-text-muted">
                  {filteredStudents.length} học sinh
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-surface backdrop-blur-xl overflow-hidden flex flex-col">
                {filteredStudents.length === 0 ? (
                   <div className="p-8 text-center text-text-muted">Không tìm thấy học sinh nào khớp với "{search}"</div>
                ) : (
                  filteredStudents.map((student, i) => {
                     const payment = paymentByKey.get(`${activeColumn.id}__${student.id}`);
                     return (
                       <StudentPaymentRow 
                         key={student.id}
                         student={{ ...student, stt: i + 1 }}
                         payment={payment}
                         column={activeColumn}
                         onSave={(val, note) => savePayment(activeColumn, student, val, note)}
                         onDelete={deletePayment}
                       />
                     );
                  })
                )}
              </div>
            </div>
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

export default QuyThu;
