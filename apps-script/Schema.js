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
};

function findColumn_(schema, key) {
  for (var i = 0; i < schema.columns.length; i++) {
    if (schema.columns[i].key === key) return schema.columns[i];
  }
  return null;
}
