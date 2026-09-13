import LopHocTabs from "../../components/lop-hoc/LopHocTabs";
import ComingSoon from "../../components/lop-hoc/ComingSoon";

function DiemDanh() {
  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-slate-300">
          Lớp học
        </span>
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl">
          Điểm danh
        </h1>
      </header>

      <div className="mt-8">
        <LopHocTabs />
      </div>

      <ComingSoon text='Chức năng điểm danh sẽ sớm có mặt tại đây.' />
    </>
  );
}

export default DiemDanh;
