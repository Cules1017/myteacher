import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Documents from "./pages/Documents";
import CongViec from "./pages/CongViec";
import Settings from "./pages/Settings";
import HocSinh from "./pages/lop-hoc/HocSinh";
import DiemDanh from "./pages/lop-hoc/DiemDanh";
import Diem from "./pages/lop-hoc/Diem";
import QuyThu from "./pages/lop-hoc/QuyThu";
import ThoiKhoaBieu from "./pages/lop-hoc/ThoiKhoaBieu";
import NhanXet from "./pages/lop-hoc/NhanXet";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tai-lieu" element={<Documents />} />
          <Route path="/lop-hoc" element={<Navigate to="/lop-hoc/hoc-sinh" replace />} />
          <Route path="/lop-hoc/hoc-sinh" element={<HocSinh />} />
          <Route path="/lop-hoc/diem-danh" element={<DiemDanh />} />
          <Route path="/lop-hoc/diem" element={<Diem />} />
          <Route path="/lop-hoc/nhan-xet" element={<NhanXet />} />
          <Route path="/lop-hoc/quy-thu" element={<QuyThu />} />
          <Route path="/lop-hoc/thoi-khoa-bieu" element={<ThoiKhoaBieu />} />
          <Route path="/cong-viec" element={<CongViec />} />
          <Route path="/cai-dat" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
