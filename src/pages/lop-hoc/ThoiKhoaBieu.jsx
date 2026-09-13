import { useMemo, useState, useEffect } from "react";
import { Loader2, Trash2, X, Eye, EyeOff } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import { isConfigured } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";
import { DAYS, SESSIONS, slotKey, groupPeriodsBySession } from "../../utils/timetable";

const TABLE = "thoikhoabieu";
const NEW_SUBJECT_VALUE = "__new__";

function emptySlotForm() {
  return { monHocId: "", ghiChu: "", cuaToi: false };
}

const SUBJECT_COLORS = [
  { bg: "bg-sky-400/20",    border: "border-sky-400/40",    text: "text-sky-200"    },
  { bg: "bg-primary-400/20",border: "border-primary-400/40",text: "text-primary-200"},
  { bg: "bg-violet-400/20", border: "border-violet-400/40", text: "text-violet-200" },
  { bg: "bg-amber-400/20",  border: "border-amber-400/40",  text: "text-amber-200"  },
  { bg: "bg-rose-400/20",   border: "border-rose-400/40",   text: "text-rose-200"   },
  { bg: "bg-cyan-400/20",   border: "border-cyan-400/40",   text: "text-cyan-200"   },
  { bg: "bg-orange-400/20", border: "border-orange-400/40", text: "text-orange-200" },
  { bg: "bg-pink-400/20",   border: "border-pink-400/40",   text: "text-pink-200"   },
  { bg: "bg-teal-400/20",   border: "border-teal-400/40",   text: "text-teal-200"   },
  { bg: "bg-lime-400/20",   border: "border-lime-400/40",   text: "text-lime-200"   },
];

const PRINT_COLORS = [
  "#bfdbfe","#bbf7d0","#ddd6fe","#fde68a","#fecdd3",
  "#a5f3fc","#fed7aa","#fbcfe8","#99f6e4","#d9f99d",
];

function useSubjectColorMap(rows) {
  return useMemo(() => {
    const map = new Map();
    (rows || []).forEach((r) => {
      if (r.monHoc && !map.has(r.monHoc)) map.set(r.monHoc, map.size);
    });
    return map;
  }, [rows]);
}

function getUiColor(monHoc, colorMap) {
  if (!monHoc || !colorMap.has(monHoc)) return null;
  return SUBJECT_COLORS[colorMap.get(monHoc) % SUBJECT_COLORS.length];
}

function getPrintColor(monHoc, colorMap) {
  if (!monHoc || !colorMap.has(monHoc)) return "#f1f5f9";
  return PRINT_COLORS[colorMap.get(monHoc) % PRINT_COLORS.length];
}

function buildPrintHTML(rows, periodsBySession, colorMap, showMyClassIcon) {
  const rowsBySlot = new Map();
  rows.forEach((r) => rowsBySlot.set(slotKey(r.thu, r.buoi, r.tiet), r));

  const dayLabels = ["Thu 2","Thu 3","Thu 4","Thu 5","Thu 6","Thu 7"];
  const dayFull   = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];

  const headerCells = dayFull
    .map((d) => `<th style="padding:10px 6px;text-align:center;font-size:13px;color:#1e293b;background:#e2e8f0;border:1px solid #cbd5e1;">${d}</th>`)
    .join("");

  const sessionBlocks = SESSIONS.map((buoi) => {
    const periods = periodsBySession[buoi] || [];
    const headerBg = buoi === "Sáng" ? "#fef9c3" : "#dbeafe";
    const icon = buoi === "Sáng" ? "☀️" : "🌙";
    const tietBg = buoi === "Sáng" ? "#fbbf24" : "#60a5fa";

    const periodRows = periods.map((p, idx) => {
      const rowBg = idx % 2 === 0 ? "#f8fafc" : "#ffffff";
      const cells = dayLabels.map((thu, di) => {
        const slot = rowsBySlot.get(slotKey(dayFull[di], buoi, p.tiet));
        const color = getPrintColor(slot ? slot.monHoc : null, colorMap);
        return `<td style="padding:5px 4px;text-align:center;vertical-align:middle;border:1px solid #e2e8f0;">` +
          (slot
            ? `<div style="background:${color};border-radius:10px;padding:8px 6px;font-size:14px;font-weight:700;color:#1e293b;min-height:48px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;"><span>${(showMyClassIcon && slot.cuaToi) ? "👤 " : ""}${slot.monHoc}</span>${slot.ghiChu ? `<span style="font-size:10px;color:#475569;font-weight:500">${slot.ghiChu}</span>` : ""}</div>`
            : `<div style="background:#f1f5f9;border-radius:10px;min-height:48px;border:1.5px dashed #cbd5e1;"></div>`
          ) + `</td>`;
      }).join("");
      const timeStr = p.gioBatDau ? `${p.gioBatDau} – ${p.gioKetThuc}` : "—";
      return `<tr style="background:${rowBg};">
        <td style="padding:6px 8px;text-align:center;vertical-align:middle;border:1px solid #e2e8f0;"><div style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${tietBg};font-weight:800;font-size:14px;color:#fff;">${p.tiet}</div></td>
        <td style="padding:6px 8px;text-align:center;font-size:12px;color:#475569;white-space:nowrap;vertical-align:middle;border:1px solid #e2e8f0;">${timeStr}</td>
        ${cells}
      </tr>`;
    }).join("");

    return `<tr><td colspan="${2 + dayFull.length}" style="background:${headerBg};padding:9px 14px;font-weight:800;font-size:13px;color:#374151;border:1px solid #e2e8f0;">${icon} Buổi ${buoi}</td></tr>
${periodRows}
<tr><td colspan="${2 + dayFull.length}" style="height:10px;background:#f8fafc;border:none;"></td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Thoi Khoa Bieu</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; padding: 20px; }
  h1 { text-align: center; font-size: 26px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  @media print { body { padding: 8px; } @page { size: A4 landscape; margin: 8mm; } }
</style>
</head>
<body>
  <h1>📚 Thời Khoá Biểu</h1>
  <p class="subtitle">Năm học 2026 – 2027</p>
  <table>
    <thead>
      <tr>
        <th style="padding:10px 8px;text-align:center;font-size:13px;color:#1e293b;background:#e2e8f0;border:1px solid #cbd5e1;width:40px;">Tiết</th>
        <th style="padding:10px 8px;text-align:center;font-size:13px;color:#1e293b;background:#e2e8f0;border:1px solid #cbd5e1;width:90px;">Thời gian</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${sessionBlocks}</tbody>
  </table>
</body>
</html>`;
}

function ThoiKhoaBieu() {
  const configured = isConfigured();

  const { data: rows, isLoading, error: queryError, refetch } = useGetRowsQuery(TABLE, { skip: !configured });
  const { data: monhocRows }   = useGetRowsQuery("monhoc",   { skip: !configured });
  const { data: khungGioRows } = useGetRowsQuery("khunggio", { skip: !configured });
  const error = queryError?.message;

  const [createRowMutation]    = useCreateRowMutation();
  const [updateRowMutation]    = useUpdateRowMutation();
  const [deleteRowMutation]    = useDeleteRowMutation();
  const [createMonHocMutation] = useCreateRowMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData]     = useState(emptySlotForm());
  const [formError, setFormError]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showMyClassIcon, setShowMyClassIcon] = useState(() => localStorage.getItem("showMyClassIcon") !== "false");

  useEffect(() => {
    localStorage.setItem("showMyClassIcon", showMyClassIcon);
  }, [showMyClassIcon]);

  const rowsBySlot = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((row) => map.set(slotKey(row.thu, row.buoi, row.tiet), row));
    return map;
  }, [rows]);

  const periodsBySession = useMemo(() => groupPeriodsBySession(khungGioRows), [khungGioRows]);
  const colorMap = useSubjectColorMap(rows);

  const openSlot = (thu, buoi, tiet) => {
    const existing = rowsBySlot.get(slotKey(thu, buoi, tiet)) || null;
    
    let fallbackMonHocId = existing?.monHocId || "";
    if (existing && existing.monHoc && !fallbackMonHocId) {
      const matched = (monhocRows || []).find(m => m.tenMon === existing.monHoc);
      if (matched) fallbackMonHocId = matched.id;
    }
    
    let initialNewName = "";
    if (existing && existing.monHoc && fallbackMonHocId) {
      const isValid = (monhocRows || []).some(m => m.id === fallbackMonHocId);
      if (!isValid) {
        fallbackMonHocId = NEW_SUBJECT_VALUE;
        initialNewName = existing.monHoc;
      }
    } else if (existing && existing.monHoc && !fallbackMonHocId) {
      fallbackMonHocId = NEW_SUBJECT_VALUE;
      initialNewName = existing.monHoc;
    }

    setActiveSlot({ thu, buoi, tiet });
    setEditingRow(existing);
    setFormData({ monHocId: fallbackMonHocId, ghiChu: existing?.ghiChu || "", cuaToi: Boolean(existing?.cuaToi) });
    setFormError(null);
    setNewSubjectName(initialNewName);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let monHocId = formData.monHocId;
    let monHoc = "";
    if (monHocId === NEW_SUBJECT_VALUE) {
      const name = newSubjectName.trim();
      if (!name) { setFormError("Nhập tên môn học mới."); return; }
      setSaving(true); setFormError(null);
      try {
        const created = await createMonHocMutation({ table: "monhoc", data: { tenMon: name } }).unwrap();
        monHocId = created.id; monHoc = created.tenMon;
      } catch (err) { setFormError(err.message); setSaving(false); return; }
    } else {
      const subject = (monhocRows || []).find((m) => m.id === monHocId);
      if (!subject) { setFormError("Chọn một môn học."); return; }
      monHoc = subject.tenMon;
    }
    setSaving(true); setFormError(null);
    const data = { ...activeSlot, monHocId, monHoc, ghiChu: formData.ghiChu, cuaToi: Boolean(formData.cuaToi) };
    try {
      if (editingRow) {
        await updateRowMutation({ table: TABLE, id: editingRow.id, data }).unwrap();
      } else {
        await createRowMutation({ table: TABLE, data }).unwrap();
      }
      setIsFormOpen(false);
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editingRow) return;
    if (!window.confirm(`Xoá tiết "${editingRow.monHoc}"?`)) return;
    setDeleting(true);
    try { await deleteRowMutation({ table: TABLE, id: editingRow.id }).unwrap(); setIsFormOpen(false); }
    catch (err) { window.alert(err.message); }
    finally { setDeleting(false); }
  };

  const handlePrint = () => {
    const html = buildPrintHTML(rows || [], periodsBySession, colorMap, showMyClassIcon);
    const win = window.open("", "_blank", "width=1200,height=820");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-border bg-transparent px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Thời khoá biểu
        </h1>
      </header>

      <div className="mt-8">
        <LopHocTabs />
      </div>

      {!configured ? (
        <NotConfiguredNotice />
      ) : (
        <main className="mt-10 flex flex-col gap-5">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowMyClassIcon(!showMyClassIcon)}
              className="flex items-center gap-2 rounded-full border border-border bg-transparent px-4 py-2 text-sm font-medium text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
            >
              {showMyClassIcon ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showMyClassIcon ? "Đang hiện tiết dạy" : "Đã ẩn tiết dạy"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-bg-base shadow-lg transition-opacity hover:opacity-90 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M9 22h6a1 1 0 001-1v-5H8v5a1 1 0 001 1z" />
              </svg>
              In thời khoá biểu
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
              {error}{" "}
              <button onClick={refetch} className="ml-2 font-semibold underline">Thử lại</button>
            </div>
          )}

          {isLoading ? (
            <LoadingState emoji="📅" />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-border bg-surface backdrop-blur-xl">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide">
                    <th className="w-12 px-3 py-4 font-medium text-center text-text-muted">Tiết</th>
                    <th className="w-28 px-3 py-4 font-medium text-text-muted">Thời gian</th>
                    {DAYS.map((d) => (
                      <th key={d} className="px-3 py-4 font-semibold text-center text-text-base">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SESSIONS.map((buoi, si) => (
                    <>
                      <tr key={`hdr-${buoi}`} className="border-b border-border">
                        <td
                          colSpan={2 + DAYS.length}
                          className={`px-5 py-2 text-xs font-bold uppercase tracking-widest ${
                            buoi === "Sáng" ? "text-amber-300 bg-amber-400/5" : "text-blue-300 bg-blue-400/5"
                          }`}
                        >
                          {buoi === "Sáng" ? "☀️ Buổi Sáng" : "🌙 Buổi Chiều"}
                        </td>
                      </tr>
                      {(periodsBySession[buoi] || []).map((period, pi) => (
                        <tr
                          key={`${buoi}-${period.tiet}`}
                          className={`border-b border-border last:border-0 ${pi % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                        >
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              buoi === "Sáng" ? "bg-amber-400/20 text-amber-200" : "bg-blue-400/20 text-blue-200"
                            }`}>
                              {period.tiet}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-xs text-text-muted">
                            {period.gioBatDau ? `${period.gioBatDau} – ${period.gioKetThuc}` : "—"}
                          </td>
                          {DAYS.map((thu) => {
                            const slot = rowsBySlot.get(slotKey(thu, buoi, period.tiet));
                            const color = getUiColor(slot?.monHoc, colorMap);
                            return (
                              <td key={thu} className="p-1.5 align-top">
                                <button
                                  onClick={() => openSlot(thu, buoi, period.tiet)}
                                  className={`flex min-h-[64px] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-center transition-all ${
                                    slot && color
                                      ? `${color.bg} border ${color.border} hover:brightness-125`
                                      : "border border-dashed border-border hover:bg-surface"
                                  }`}
                                >
                                  {slot ? (
                                    <>
                                      <div className="flex items-center justify-center gap-1">
                                        {(showMyClassIcon && slot.cuaToi) && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                                        <span className={`text-sm font-semibold ${color?.text ?? "text-primary-200"}`}>
                                          {slot.monHoc}
                                        </span>
                                      </div>
                                      {slot.ghiChu && (
                                        <span className="text-[10px] text-text-muted leading-tight">{slot.ghiChu}</span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-text-muted">+ Thêm</span>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {si < SESSIONS.length - 1 && (
                        <tr key={`spacer-${buoi}`}><td colSpan={2 + DAYS.length} className="h-2" /></tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}

      {isFormOpen && activeSlot && (
        <SlotFormModal
          slot={activeSlot}
          monhocRows={monhocRows || []}
          formData={formData}
          setFormData={setFormData}
          newSubjectName={newSubjectName}
          setNewSubjectName={setNewSubjectName}
          onSubmit={handleSubmit}
          onClose={closeForm}
          onDelete={editingRow ? handleDelete : null}
          saving={saving}
          deleting={deleting}
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
        <code className="rounded bg-black/30 px-1.5 py-0.5">.env</code>.
      </p>
    </div>
  );
}

function SlotFormModal({ slot, monhocRows, formData, setFormData, newSubjectName, setNewSubjectName, onSubmit, onClose, onDelete, saving, deleting, error, isEditing }) {
  const setField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg-base/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-base">{isEditing ? "Sửa tiết học" : "Thêm tiết học"}</h2>
            <p className="mt-1 text-sm text-text-muted">{slot.thu} · Buổi {slot.buoi.toLowerCase()} · Tiết {slot.tiet}</p>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-text-base">
            Môn học
            <select value={formData.monHocId} onChange={(e) => setField("monHocId", e.target.value)} autoFocus className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50">
              <option value="" className="bg-bg-base">Chọn môn học...</option>
              {monhocRows.map((m) => <option key={m.id} value={m.id} className="bg-bg-base">{m.tenMon}</option>)}
              <option value={NEW_SUBJECT_VALUE} className="bg-bg-base">+ Thêm môn học mới</option>
            </select>
          </label>
          {formData.monHocId === NEW_SUBJECT_VALUE && (
            <label className="flex flex-col gap-1.5 text-sm text-text-base">
              Tên môn học mới
              <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Ví dụ: Toán" className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none placeholder:text-text-muted focus:border-primary-400/50" />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm text-text-base">
            Ghi chú (phòng học, giáo viên,...)
            <input type="text" value={formData.ghiChu} onChange={(e) => setField("ghiChu", e.target.value)} className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50" />
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-text-base">
            <input type="checkbox" checked={formData.cuaToi} onChange={(e) => setField("cuaToi", e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-primary-500 focus:ring-primary-500/50" />
            Đây là tiết tôi dạy
          </label>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <div className="mt-2 flex items-center justify-between gap-3">
            {onDelete ? (
              <button type="button" onClick={onDelete} disabled={deleting} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-400/10 disabled:opacity-50">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Xoá
              </button>
            ) : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-base transition-colors hover:bg-surface-hover hover:text-text-base">Huỷ</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ThoiKhoaBieu;
