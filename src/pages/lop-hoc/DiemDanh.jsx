import { useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Search, Loader2, Pencil, Trash2, X, FileSpreadsheet, Check } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import ConfirmModal from "../../components/ConfirmModal";
import { isConfigured, exportSheet } from "../../services/sheetApi";
import { useGetRowsQuery, useCreateRowMutation, useUpdateRowMutation, useDeleteRowMutation } from "../../store/sheetApi";
import { normalizeText } from "../../utils/text";
import { addDays, findHolidayForDate } from "../../utils/schoolYear";
import LopHocTabs from "../../components/lop-hoc/LopHocTabs";

const TABLE = "diemdanh";
const LOAI_VANG_OPTIONS = ["Có phép", "Không phép"];
const CO_PHEP_FILL = "FFBBF7D0";
const CO_PHEP_FONT = "FF166534";
const KHONG_PHEP_FILL = "FFFECACA";
const KHONG_PHEP_FONT = "FF991B1B";

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateVN(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function parseISODateLocal(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function DiemDanh() {
  const configured = isConfigured();

  const [date, setDate] = useState(todayStr());
  const [confirmConfig, setConfirmConfig] = useState(null);

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
  const { data: excludedPeriods } = useGetRowsQuery("ngayloaitru", { skip: !configured });
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

  const [lookupOpen, setLookupOpen] = useState(false);

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

  const handleDelete = (record) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xác nhận xoá",
      message: `Xoá ghi nhận vắng của "${record.hoVaTen}"?`,
      isDangerous: true,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
        setDeletingId(record.id);
        try {
          await deleteRowMutation({ table: TABLE, id: record.id }).unwrap();
          setConfirmConfig(null);
        } catch (err) {
          window.alert(err.message);
          setConfirmConfig((prev) => ({ ...prev, isLoading: false }));
        } finally {
          setDeletingId(null);
        }
      },
      onCancel: () => setConfirmConfig(null),
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
            <label className="flex items-center gap-2 text-sm text-text-base">
              Ngày điểm danh
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
              />
            </label>
            {date !== todayStr() && (
              <button
                onClick={() => setDate(todayStr())}
                className="text-sm font-medium text-primary-300 transition-colors hover:text-primary-200"
              >
                Hôm nay
              </button>
            )}
            <button
              onClick={() => setLookupOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-base transition-colors hover:bg-surface-hover"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Tra cứu & Xuất Excel
            </button>
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
            <div className="flex items-center gap-2 rounded-full border border-border bg-transparent px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm học sinh để ghi nhận vắng..."
                className="w-full bg-transparent text-sm text-text-base outline-none placeholder:text-text-muted"
              />
            </div>
            {query.trim() && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-bg-base/95 shadow-2xl backdrop-blur-xl">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-text-muted">Không tìm thấy học sinh.</p>
                ) : (
                  searchResults.map((s) => {
                    const marked = attendanceByStudentId.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-text-base transition-colors hover:bg-surface-hover"
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
            <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-base">{selected.hoVaTen}</h2>
                <button
                  onClick={closeMarkForm}
                  aria-label="Đóng"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
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
                          ? "bg-primary-500 text-white shadow-md"
                          : "border border-border text-text-base hover:bg-surface-hover"
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
                  className="rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-text-base outline-none focus:border-primary-400/50"
                />
                {formError && <p className="text-sm text-rose-300">{formError}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingRecord ? "Cập nhật" : "Lưu"}
                </button>
              </form>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-center text-sm font-medium text-text-muted">
              Danh sách vắng ngày {formatDateVN(date)} ({attendanceForDate.length})
            </h2>

            {attendanceLoading && !error ? (
              <LoadingState emoji="📝" />
            ) : attendanceForDate.length === 0 ? (
              <div className="rounded-3xl border border-border bg-transparent px-6 py-12 text-center text-text-muted">
                Chưa ghi nhận học sinh vắng trong ngày này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-border bg-surface backdrop-blur-xl">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Họ và tên học sinh</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Loại vắng</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Ghi chú</th>
                      <th className="px-4 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceForDate.map((record) => (
                      <tr key={record.id} className="border-b border-border last:border-0 hover:bg-surface">
                        <td className="whitespace-nowrap px-4 py-3 text-text-base">{record.hoVaTen}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              record.loaiVang === "Có phép"
                                ? "bg-primary-400/10 text-primary-300"
                                : "bg-rose-400/10 text-rose-300"
                            }`}
                          >
                            {record.loaiVang}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-base">{record.ghiChu || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => selectStudent({ id: record.hocSinhId, hoVaTen: record.hoVaTen })}
                              aria-label="Sửa"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleDelete(record)}
                              disabled={deletingId === record.id}
                              aria-label="Xoá"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-text-base transition-colors hover:bg-rose-400/20 hover:text-rose-300 disabled:opacity-50"
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

      {lookupOpen && (
        <LookupExportModal
          students={students || []}
          attendance={attendance || []}
          excludedPeriods={excludedPeriods || []}
          onClose={() => setLookupOpen(false)}
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

function LookupExportModal({ students, attendance, excludedPeriods, onClose }) {
  const [scope, setScope] = useState("all"); // "all" | "selected"
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pickerQuery, setPickerQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportMode, setExportMode] = useState("list"); // "list" | "calendar"
  const [destination, setDestination] = useState("download"); // "download" | "sheet"
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [sheetResult, setSheetResult] = useState(null); // { url, id }

  const studentsById = useMemo(() => {
    const map = new Map();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const birthdayOf = (studentId) => {
    const ngaySinh = studentsById.get(studentId)?.ngaySinh;
    return ngaySinh ? formatDateVN(ngaySinh) : "—";
  };

  const pickerResults = useMemo(() => {
    const q = normalizeText(pickerQuery);
    return students.filter((s) => !q || normalizeText(s.hoVaTen).includes(q));
  }, [students, pickerQuery]);

  const toggleStudent = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pickerResults.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const clearSelected = () => setSelectedIds(new Set());

  const results = useMemo(() => {
    return attendance
      .filter((a) => scope === "all" || selectedIds.has(a.hocSinhId))
      .filter((a) => !fromDate || a.ngay >= fromDate)
      .filter((a) => !toDate || a.ngay <= toDate)
      .slice()
      .sort((a, b) =>
        a.ngay === b.ngay ? a.hoVaTen.localeCompare(b.hoVaTen, "vi") : a.ngay.localeCompare(b.ngay)
      );
  }, [attendance, scope, selectedIds, fromDate, toDate]);

  const coPhepCount = results.filter((r) => r.loaiVang === "Có phép").length;
  const khongPhepCount = results.length - coPhepCount;

  const rowStudents = useMemo(() => {
    return scope === "all" ? students : students.filter((s) => selectedIds.has(s.id));
  }, [scope, students, selectedIds]);

  const schoolDays = useMemo(() => {
    if (exportMode !== "calendar" || !fromDate || !toDate) return [];
    const start = parseISODateLocal(fromDate);
    const end = parseISODateLocal(toDate);
    if (start > end) return [];
    const days = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      const dow = cursor.getDay();
      if (dow === 0 || dow === 6) continue;
      if (findHolidayForDate(cursor, excludedPeriods)) continue;
      days.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate()
      ).padStart(2, "0")}`);
    }
    return days;
  }, [exportMode, fromDate, toDate, excludedPeriods]);

  const attendanceByKey = useMemo(() => {
    const map = new Map();
    attendance.forEach((a) => map.set(`${a.hocSinhId}__${a.ngay}`, a));
    return map;
  }, [attendance]);

  const buildListExportData = () => ({
    sheetTitle: "Diem danh",
    headers: ["Stt", "Họ và tên học sinh", "Ngày sinh", "Ngày", "Loại vắng", "Ghi chú"],
    rows: results.map((r, i) => [
      i + 1,
      r.hoVaTen,
      birthdayOf(r.hocSinhId),
      formatDateVN(r.ngay),
      r.loaiVang,
      r.ghiChu || "",
    ]),
    cellColors: [],
  });

  const buildCalendarExportData = () => {
    const headers = ["Stt", "Họ và tên học sinh", "Ngày sinh", ...schoolDays.map(formatDateVN)];
    const rows = [];
    const cellColors = [];
    rowStudents.forEach((s, idx) => {
      const rowValues = [idx + 1, s.hoVaTen, birthdayOf(s.id)];
      const rowColors = [null, null, null];
      schoolDays.forEach((day) => {
        const record = attendanceByKey.get(`${s.id}__${day}`);
        if (!record) {
          rowValues.push("");
          rowColors.push(null);
        } else if (record.loaiVang === "Có phép") {
          rowValues.push(record.ghiChu ? `x (${record.ghiChu})` : "x");
          rowColors.push("green");
        } else {
          rowValues.push("x");
          rowColors.push("red");
        }
      });
      rows.push(rowValues);
      cellColors.push(rowColors);
    });
    return { sheetTitle: "Bang cham cong", headers, rows, cellColors };
  };

  const downloadAsExcel = async ({ sheetTitle, headers, rows, cellColors }, filename) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetTitle);
    sheet.views = [{ state: "frozen", xSplit: 3, ySplit: 1 }];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 26;
    sheet.getColumn(3).width = 12;
    for (let c = 4; c <= headers.length; c++) sheet.getColumn(c).width = 12;

    rows.forEach((rowValues, ri) => {
      const row = sheet.addRow(rowValues);
      row.getCell(1).alignment = { horizontal: "center" };
      (cellColors[ri] || []).forEach((color, ci) => {
        if (!color) return;
        const cell = row.getCell(ci + 1);
        cell.alignment = { horizontal: "center" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: color === "green" ? CO_PHEP_FILL : KHONG_PHEP_FILL },
        };
        cell.font = { color: { argb: color === "green" ? CO_PHEP_FONT : KHONG_PHEP_FONT }, bold: true };
      });
    });

    await downloadWorkbook(workbook, filename);
  };

  const exportAsGoogleSheet = async ({ sheetTitle, headers, rows, cellColors }, title) => {
    setExporting(true);
    setExportError(null);
    setSheetResult(null);
    try {
      const result = await exportSheet({ title, sheetName: sheetTitle, headers, rows, cellColors });
      setSheetResult(result);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    let data;
    let filenamePrefix;
    if (exportMode === "calendar") {
      if (!fromDate || !toDate) {
        window.alert("Vui lòng chọn Từ ngày và Đến ngày để xuất bảng theo lịch.");
        return;
      }
      if (rowStudents.length === 0) {
        window.alert("Không có học sinh nào trong phạm vi đã chọn.");
        return;
      }
      if (schoolDays.length === 0) {
        window.alert("Không có ngày học nào trong khoảng thời gian đã chọn.");
        return;
      }
      data = buildCalendarExportData();
      filenamePrefix = `BangChamCong_${fromDate.replaceAll("-", "")}-${toDate.replaceAll("-", "")}`;
    } else {
      if (results.length === 0) {
        window.alert("Không có dữ liệu phù hợp để xuất.");
        return;
      }
      data = buildListExportData();
      filenamePrefix = `DiemDanh_${todayStr().replaceAll("-", "")}`;
    }

    if (destination === "sheet") {
      exportAsGoogleSheet(data, filenamePrefix);
    } else {
      downloadAsExcel(data, `${filenamePrefix}.xlsx`);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-bg-base/95 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-8">
          <h2 className="text-lg font-semibold text-text-base">Tra cứu & xuất Excel điểm danh</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text-base"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Phạm vi</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    scope === "all"
                      ? "bg-primary-500 text-white shadow-md"
                      : "border border-border text-text-base hover:bg-surface-hover"
                  }`}
                >
                  Toàn bộ lớp
                </button>
                <button
                  type="button"
                  onClick={() => setScope("selected")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    scope === "selected"
                      ? "bg-primary-500 text-white shadow-md"
                      : "border border-border text-text-base hover:bg-surface-hover"
                  }`}
                >
                  Chọn học sinh {selectedIds.size > 0 && `(${selectedIds.size})`}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Kiểu xuất</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExportMode("list")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    exportMode === "list"
                      ? "bg-primary-500 text-white shadow-md"
                      : "border border-border text-text-base hover:bg-surface-hover"
                  }`}
                >
                  Danh sách
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode("calendar")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    exportMode === "calendar"
                      ? "bg-primary-500 text-white shadow-md"
                      : "border border-border text-text-base hover:bg-surface-hover"
                  }`}
                >
                  Bảng theo ngày (lịch)
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Đích xuất</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDestination("download")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    destination === "download"
                      ? "bg-primary-500 text-white shadow-md"
                      : "border border-border text-text-base hover:bg-surface-hover"
                  }`}
                >
                  Tải file Excel
                </button>
                <button
                  type="button"
                  onClick={() => setDestination("sheet")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    destination === "sheet"
                      ? "bg-primary-500 text-white shadow-md"
                      : "border border-border text-text-base hover:bg-surface-hover"
                  }`}
                >
                  Google Sheets
                </button>
              </div>
            </div>

            {scope === "selected" && (
              <div className="rounded-2xl border border-border bg-surface p-3">
                <div className="flex items-center gap-2 rounded-full border border-border bg-transparent px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-text-muted" />
                  <input
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Tìm học sinh..."
                    className="w-full bg-transparent text-sm text-text-base outline-none placeholder:text-text-muted"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between px-1 text-xs">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="font-medium text-primary-300 hover:text-primary-200"
                  >
                    Chọn tất cả
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={clearSelected}
                      className="font-medium text-text-muted hover:text-text-base"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto">
                  {pickerResults.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-text-muted">Không tìm thấy học sinh.</p>
                  ) : (
                    pickerResults.map((s) => {
                      const checked = selectedIds.has(s.id);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggleStudent(s.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-text-base hover:bg-surface-hover"
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              checked ? "border-primary-400 bg-primary-400/90 text-bg-base" : "border-border"
                            }`}
                          >
                            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="flex flex-col">
                            <span>{s.hoVaTen}</span>
                            <span className="text-xs text-text-muted">Ngày sinh: {birthdayOf(s.id)}</span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Khoảng thời gian {exportMode === "calendar" ? "(bắt buộc)" : "(không bắt buộc)"}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-text-base">
                  Từ ngày
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-text-base">
                  Đến ngày
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-xl border border-border bg-transparent px-3 py-2 text-text-base outline-none focus:border-primary-400/50"
                  />
                </label>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                    }}
                    className="text-sm font-medium text-text-muted hover:text-text-base"
                  >
                    Xoá bộ lọc ngày
                  </button>
                )}
              </div>
            </div>

            {exportMode === "list" ? (
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-text-base">
                    Kết quả: <span className="font-semibold text-text-base">{results.length}</span> buổi vắng
                    {results.length > 0 && (
                      <span className="text-text-muted">
                        {" "}
                        (Có phép: {coPhepCount} · Không phép: {khongPhepCount})
                      </span>
                    )}
                  </p>
                </div>

                {results.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-transparent px-6 py-10 text-center text-sm text-text-muted">
                    Không có dữ liệu phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-auto rounded-2xl border border-border bg-surface">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="sticky top-0 bg-bg-base/95">
                        <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Họ và tên học sinh</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Ngày sinh</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Ngày</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Loại vắng</th>
                          <th className="px-4 py-3 font-medium">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface">
                            <td className="whitespace-nowrap px-4 py-3 text-text-base">{r.hoVaTen}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-text-muted">{birthdayOf(r.hocSinhId)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-text-base">{formatDateVN(r.ngay)}</td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  r.loaiVang === "Có phép"
                                    ? "bg-primary-400/10 text-primary-300"
                                    : "bg-rose-400/10 text-rose-300"
                                }`}
                              >
                                {r.loaiVang}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-text-base">{r.ghiChu || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-transparent px-5 py-4">
                {!fromDate || !toDate ? (
                  <p className="text-sm text-text-muted">
                    Chọn khoảng thời gian ở trên để xem số ngày học sẽ được xuất.
                  </p>
                ) : (
                  <p className="text-sm text-text-base">
                    Sẽ xuất <span className="font-semibold text-text-base">{schoolDays.length}</span> ngày học
                    (đã loại trừ Thứ Bảy, Chủ Nhật và các ngày nghỉ lễ đã cấu hình) cho{" "}
                    <span className="font-semibold text-text-base">{rowStudents.length}</span> học sinh.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded bg-rose-300/80" /> x — Vắng không phép
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded bg-primary-300/80" /> x (ghi chú) — Vắng có phép
                  </span>
                </div>
              </div>
            )}

            {sheetResult && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary-400/30 bg-primary-400/10 px-4 py-3 text-sm text-primary-200">
                <span>Đã tạo Google Sheet thành công.</span>
                <a
                  href={sheetResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-2 hover:text-primary-100"
                >
                  Mở Google Sheet ↗
                </a>
              </div>
            )}
            {exportError && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {exportError}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-base transition-colors hover:bg-surface-hover hover:text-text-base"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-400 to-blue-500 px-4 py-2 text-sm font-semibold text-bg-base transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {destination === "sheet" ? "Xuất lên Google Sheets" : "Tải file Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiemDanh;
