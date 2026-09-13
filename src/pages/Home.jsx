import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Users, Settings, ArrowRight, Calendar as CalendarIcon, Check, Clock, AlertTriangle, Loader2 } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Calendar from "../components/Calendar";
import { useGetRowsQuery, useUpdateRowMutation } from "../store/sheetApi";
import { isConfigured } from "../services/sheetApi";
import { getTodoType, getTypeIcon, isOverdue, isDueToday, isDueSoon, todoTypeBadgeClass, formatDateVN } from "../utils/todo";

const shortcuts = [
  {
    to: "/tai-lieu",
    title: "Tài liệu",
    description: "Giáo án, bài giảng và tài nguyên giảng dạy.",
    icon: FolderOpen,
    accent: "from-blue-500 to-primary-400",
  },
  {
    to: "/lop-hoc",
    title: "Lớp học",
    description: "Quản lý danh sách học sinh trong lớp.",
    icon: Users,
    accent: "from-amber-400 to-rose-400",
  },
  {
    to: "/cai-dat",
    title: "Cài đặt",
    description: "Tùy chỉnh giao diện và thông tin ứng dụng.",
    icon: Settings,
    accent: "from-fuchsia-500 to-indigo-400",
  },
];


function RecentTasks({ rows, customTypeRows, isLoading }) {
  const [updateRow] = useUpdateRowMutation();
  const [togglingId, setTogglingId] = useState(null);

  const toggleDone = async (e, row) => {
    e.preventDefault();
    setTogglingId(row.id);
    try {
      await updateRow({ table: "congviec", id: row.id, data: { hoanThanh: !row.hoanThanh } }).unwrap();
    } catch (err) {
      window.alert("Lỗi khi cập nhật trạng thái");
    } finally {
      setTogglingId(null);
    }
  };

  const recentTasks = useMemo(() => {
    if (!rows) return [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const absDiff = (dateStr) => {
      if (!dateStr) return Infinity;
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return Math.abs(d.getTime() - todayDate.getTime());
    };

    const sorted = [...rows].sort((a, b) => {
      const aOverdue = isOverdue(a, todayDate);
      const bOverdue = isOverdue(b, todayDate);
      const aDone = Boolean(a.hoanThanh);
      const bDone = Boolean(b.hoanThanh);

      const getGroup = (isItemOverdue, isItemDone) => {
        if (isItemDone) return 3;
        if (isItemOverdue) return 1;
        return 2;
      };

      const groupA = getGroup(aOverdue, aDone);
      const groupB = getGroup(bOverdue, bDone);
      if (groupA !== groupB) return groupA - groupB;

      const diffA = absDiff(a.hanNgay);
      const diffB = absDiff(b.hanNgay);
      if (diffA !== diffB) return diffA - diffB;

      const timeA = a.hanGio || "23:59";
      const timeB = b.hanGio || "23:59";
      return timeA.localeCompare(timeB);
    });

    return sorted.slice(0, 10);
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-text-base">
            <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Việc cần chú ý
          </h2>
        </div>
        <div className="flex items-center justify-center rounded-3xl border border-border bg-surface p-8">
          <div className="flex items-center gap-3 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Đang tải việc cần làm...</span>
          </div>
        </div>
      </div>
    );
  }

  if (recentTasks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Việc cần chú ý
        </h2>
        <Link to="/cong-viec" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors">
          Xem tất cả
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {recentTasks.map((row) => {
          const type = getTodoType(row.loai, customTypeRows);
          const Icon = getTypeIcon(type.icon);
          const overdue = isOverdue(row);
          const dueToday = !row.hoanThanh && isDueToday(row);
          const dueSoon = isDueSoon(row);
          const isToggling = togglingId === row.id;

          return (
            <Link
              key={row.id}
              to="/cong-viec"
              className={`flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-xl transition-colors ${
                row.hoanThanh 
                  ? "bg-surface border-border hover:bg-surface-hover opacity-60" 
                  : overdue 
                    ? "bg-rose-400/10 border-rose-400/30 hover:bg-rose-400/20" 
                    : dueSoon 
                      ? "bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/20" 
                      : "bg-surface border-border hover:bg-surface-hover"
              }`}
            >
              <button
                onClick={(e) => toggleDone(e, row)}
                disabled={isToggling}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  row.hoanThanh
                    ? "border-primary-400 bg-primary-400/90 text-bg-base"
                    : `border-border hover:border-primary-400/60 ${isToggling ? "text-primary-400" : "text-transparent"}`
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>

              <div className="flex flex-1 flex-col gap-1.5 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-medium text-text-base ${row.hoanThanh ? "line-through" : ""}`}>{row.tieuDe}</span>
                  <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${todoTypeBadgeClass(row.loai, customTypeRows)}`}>
                    <Icon className="h-3 w-3" strokeWidth={2} />
                    {type.label}
                  </span>
                  {overdue && (
                    <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[11px] font-medium text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Quá hạn
                    </span>
                  )}
                  {dueToday && !overdue && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> Hôm nay
                    </span>
                  )}
                </div>
                {row.hanNgay && (
                  <span className="text-xs text-text-muted">
                    Hạn: {formatDateVN(row.hanNgay)}
                    {row.hanGio ? ` lúc ${row.hanGio}` : ""}
                  </span>
                )}
                {row.moTa && <span className="text-sm text-text-base line-clamp-1">{row.moTa}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Home() {
  const configured = isConfigured();
  const { data: rows, isLoading: loadingTodos }       = useGetRowsQuery("congviec",    { skip: !configured });
  const { data: customTypeRows, isLoading: loadingTypes } = useGetRowsQuery("loaicongviec", { skip: !configured });

  const isLoading = configured && (loadingTodos || loadingTypes);

  return (
    <>
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-border bg-transparent px-4 py-1 text-xs font-medium uppercase tracking-widest text-text-base">
          Góc công cụ cá nhân
        </span>
        <h1 className="bg-gradient-to-r from-text-base to-primary-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          Tiện ích của My
        </h1>
        <p className="max-w-xl text-base text-text-muted sm:text-lg">
          Tổng hợp các công cụ và tài nguyên phục vụ công việc giảng dạy, tất cả ở một nơi.
        </p>
      </header>

      <main className="mt-12 flex flex-col gap-8">
        <Calendar />

        {configured && <RecentTasks rows={rows} customTypeRows={customTypeRows} isLoading={isLoading} />}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map(({ to, title, description, icon: Icon, accent }) => (
            <Link key={to} to={to}>
              <GlassCard accent={accent}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-hover ring-1 ring-border">
                  <Icon className="h-7 w-7" strokeWidth={2} />
                </div>
                <div className="relative flex flex-col gap-1.5">
                  <h2 className="text-xl font-semibold text-text-base">{title}</h2>
                  <p className="text-sm leading-relaxed text-text-base">{description}</p>
                </div>
                <div className="relative mt-auto flex items-center gap-2 text-sm font-medium text-primary-300">
                  Xem ngay
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.2} />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </main>

      <footer className="mt-auto pt-16 text-center text-sm text-text-muted">
        Made with ♥ for My
      </footer>
    </>
  );
}

export default Home;
