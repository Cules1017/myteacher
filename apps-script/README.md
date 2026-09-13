# Backend Apps Script (Google Sheets làm database)

Code trong thư mục này chạy trên Google Apps Script, gắn với một Google Sheet đóng vai trò
"database" — mỗi bảng trong `Schema.js` tương ứng 1 sheet/tab.

## Cấu trúc

- `Schema.js` — khai báo cột của từng bảng (đây là nơi duy nhất cần sửa khi thêm bảng/cột mới).
- `Migrate.js` — hàm `migrate()`: tạo sheet còn thiếu, thêm cột còn thiếu vào cuối. An toàn để chạy lại nhiều lần (không xoá/đổi thứ tự dữ liệu cũ).
- `Api.js` — `doGet`/`doPost`: API list/create/update/delete cho mọi bảng.
- `Utils.js` — helper dùng chung (đọc/ghi hàng theo schema, JSON response, kiểm tra token).

## Thiết lập lần đầu (chỉ bạn tự làm được vì cần đăng nhập Google)

1. Tạo một Google Sheet mới (ví dụ đặt tên "My Teacher DB").
2. Trong Sheet đó: **Extensions → Apps Script** để tạo project gắn với Sheet này.
3. Lấy Script ID: trong Apps Script editor → **Project Settings** (⚙️) → copy "Script ID".
4. Cài clasp (một lần, máy nào cũng chỉ cần 1 lần):
   ```bash
   npm install -g @google/clasp
   clasp login
   ```
5. Trong thư mục `apps-script/` của repo này:
   ```bash
   cp .clasp.json.example .clasp.json
   ```
   rồi sửa `scriptId` trong `.clasp.json` thành Script ID vừa copy ở bước 3.
6. Đẩy code lên:
   ```bash
   cd apps-script
   clasp push
   ```
7. Mở lại Apps Script editor (script.google.com), chọn hàm `migrate` ở thanh chức năng, bấm ▶ Run.
   Lần đầu Google sẽ hỏi cấp quyền truy cập Sheet — đồng ý. Sau khi chạy xong, quay lại Google
   Sheet sẽ thấy tab `HocSinh` xuất hiện với đủ cột.
8. Trong Apps Script editor: **Project Settings** → **Script Properties** → **Add script property**:
   - Property: `API_TOKEN`
   - Value: một chuỗi bí mật tự đặt (ví dụ mở terminal gõ `openssl rand -hex 16`).
9. **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Bấm Deploy, copy **Web app URL**.
10. Ở gốc repo (`my-teacher/`), tạo file `.env` (copy từ `.env.example`) và điền:
    ```
    VITE_APPS_SCRIPT_URL=<Web app URL vừa copy>
    VITE_APPS_SCRIPT_TOKEN=<chuỗi bí mật đã đặt ở bước 8>
    ```
11. Chạy lại `npm run dev`, vào trang "Lớp học" để thử thêm/sửa/xoá học sinh.

## Khi cần đổi code sau này

Sửa file `.js` trong thư mục này rồi chạy `clasp push` từ `apps-script/` là đủ — không cần deploy
lại (deployment cũ tự dùng code mới), trừ khi bạn đổi `doGet`/`doPost` theo cách cần deployment mới.

## Thêm bảng mới

Thêm 1 entry vào `SCHEMAS` trong `Schema.js` (tên sheet + danh sách cột), `clasp push`, rồi chạy lại
hàm `migrate()` một lần — sheet mới sẽ tự được tạo, không đụng tới các bảng đã có.
