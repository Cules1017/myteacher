/**
 * Central schema registry — one entry per "table" (= one Sheet tab).
 * Add a new table here and re-run migrate() to create it; Migrate.js
 * only ever adds sheets/columns, never removes or reorders existing ones.
 */
var SCHEMAS = {
  hocsinh: {
    sheetName: 'HocSinh',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'hoVaTen', header: 'Họ và tên học sinh', type: 'string' },
      { key: 'ngaySinh', header: 'Ngày, tháng, năm sinh', type: 'date' },
      { key: 'gioiTinh', header: 'Giới tính', type: 'string' },
      { key: 'danToc', header: 'Dân tộc', type: 'string' },
      { key: 'noiSinh', header: 'Nơi sinh (tên tỉnh)', type: 'string' },
      { key: 'hoTenCha', header: 'Họ tên cha', type: 'string' },
      { key: 'hoTenMe', header: 'Họ tên mẹ', type: 'string' },
      { key: 'noiCuTru', header: 'Nơi cư trú (Ấp, xã)', type: 'string' },
      { key: 'hsNoiTru', header: 'HS nội trú', type: 'boolean' },
      { key: 'hsBanTru', header: 'HS bán trú buổi trưa', type: 'boolean' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  diemdanh: {
    sheetName: 'DiemDanh',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'ngay', header: 'Ngày', type: 'date' },
      { key: 'hocSinhId', header: 'Mã học sinh', type: 'string' },
      { key: 'hoVaTen', header: 'Họ và tên học sinh', type: 'string' },
      { key: 'loaiVang', header: 'Loại vắng', type: 'string' },
      { key: 'ghiChu', header: 'Ghi chú', type: 'string' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  namhoc: {
    sheetName: 'NamHoc',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'ngayBatDau', header: 'Ngày bắt đầu', type: 'date' },
      { key: 'ngayKetThuc', header: 'Ngày kết thúc', type: 'date' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  ngayloaitru: {
    sheetName: 'NgayLoaiTru',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'tieuDe', header: 'Tiêu đề', type: 'string' },
      { key: 'tuNgay', header: 'Từ ngày', type: 'date' },
      { key: 'denNgay', header: 'Đến ngày', type: 'date' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  monhoc: {
    sheetName: 'MonHoc',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'tenMon', header: 'Tên môn học', type: 'string' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  cotdiem: {
    sheetName: 'CotDiem',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'monHocId', header: 'Mã môn học', type: 'string' },
      { key: 'tenCot', header: 'Tên cột điểm', type: 'string' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  diem: {
    sheetName: 'Diem',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'monHocId', header: 'Mã môn học', type: 'string' },
      { key: 'cotDiemId', header: 'Mã cột điểm', type: 'string' },
      { key: 'hocSinhId', header: 'Mã học sinh', type: 'string' },
      { key: 'hoVaTen', header: 'Họ và tên học sinh', type: 'string' },
      { key: 'diem', header: 'Điểm', type: 'number' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  thoikhoabieu: {
    sheetName: 'ThoiKhoaBieu',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'thu', header: 'Thứ', type: 'string' },
      { key: 'buoi', header: 'Buổi', type: 'string' },
      { key: 'tiet', header: 'Tiết', type: 'number' },
      { key: 'monHocId', header: 'Mã môn học', type: 'string' },
      { key: 'monHoc', header: 'Môn học', type: 'string' },
      { key: 'ghiChu', header: 'Ghi chú', type: 'string' },
      { key: 'cuaToi', header: 'Của tôi', type: 'boolean' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  khunggio: {
    sheetName: 'KhungGio',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'buoi', header: 'Buổi', type: 'string' },
      { key: 'tiet', header: 'Tiết', type: 'number' },
      { key: 'gioBatDau', header: 'Giờ bắt đầu', type: 'time' },
      { key: 'gioKetThuc', header: 'Giờ kết thúc', type: 'time' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  congviec: {
    sheetName: 'CongViec',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'tieuDe', header: 'Tiêu đề', type: 'string' },
      { key: 'loai', header: 'Loại công việc', type: 'string' },
      { key: 'hanNgay', header: 'Hạn ngày', type: 'date' },
      { key: 'hanGio', header: 'Hạn giờ', type: 'time' },
      { key: 'moTa', header: 'Mô tả', type: 'string' },
      { key: 'hoanThanh', header: 'Hoàn thành', type: 'boolean' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  loaicongviec: {
    sheetName: 'LoaiCongViec',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'ten', header: 'Tên loại', type: 'string' },
      { key: 'icon', header: 'Icon', type: 'string' },
      { key: 'mauSac', header: 'Màu', type: 'string' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  nhanxet: {
    sheetName: 'NhanXet',
    columns: [
      { key: 'id',        header: 'ID',         type: 'string' },
      { key: 'hocSinhId', header: 'Hoc Sinh ID', type: 'string' },
      { key: 'noiDung',   header: 'Noi Dung',    type: 'string' },
      { key: 'phanLoai',  header: 'Phan Loai',   type: 'string' },
      { key: 'createdAt', header: 'Created At',  type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At',  type: 'datetime' },
    ],
  },
  khoanthu: {
    sheetName: 'KhoanThu',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'tenKhoanThu', header: 'Tên khoản thu', type: 'string' },
      { key: 'mucThu', header: 'Mức thu', type: 'number' },
      { key: 'hanDong', header: 'Hạn đóng', type: 'date' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  dongquy: {
    sheetName: 'DongQuy',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'khoanThuId', header: 'Mã khoản thu', type: 'string' },
      { key: 'hocSinhId', header: 'Mã học sinh', type: 'string' },
      { key: 'hoVaTen', header: 'Họ và tên học sinh', type: 'string' },
      { key: 'soTien', header: 'Số tiền', type: 'number' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  tailieu: {
    sheetName: 'TaiLieu',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'tieuDe', header: 'Tiêu đề', type: 'string' },
      { key: 'moTa', header: 'Mô tả', type: 'string' },
      { key: 'lienKet', header: 'Liên kết', type: 'string' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
  ghichu: {
    sheetName: 'GhiChu',
    columns: [
      { key: 'id', header: 'ID', type: 'string' },
      { key: 'tieuDe', header: 'Tiêu đề', type: 'string' },
      { key: 'noiDung', header: 'Nội dung', type: 'string' },
      { key: 'mauSac', header: 'Màu sắc', type: 'string' },
      { key: 'ghim', header: 'Ghim', type: 'boolean' },
      { key: 'createdAt', header: 'Created At', type: 'datetime' },
      { key: 'updatedAt', header: 'Updated At', type: 'datetime' },
    ],
  },
};

function findColumn_(schema, key) {
  for (var i = 0; i < schema.columns.length; i++) {
    if (schema.columns[i].key === key) return schema.columns[i];
  }
  return null;
}
// 
// Sun Sep 13 19:46:21 +07 2026
