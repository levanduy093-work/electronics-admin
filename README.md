## electronics-admin – Web Admin cho Electronics Shop

`electronics-admin` là **ứng dụng web quản trị** (React + TypeScript + Vite) dùng để thao tác với backend NestJS của cửa hàng linh kiện điện tử:

- Quản lý **sản phẩm, đơn hàng, người dùng, vouchers, đánh giá, giao dịch, vận chuyển, tồn kho, thông báo**.
- Hỗ trợ **dashboard** tổng quan, xem và cập nhật trạng thái hệ thống theo thời gian thực (kết hợp Socket.IO / FCM từ backend).

---

## 1. Công nghệ chính

- **React + TypeScript + Vite**.
- **UI**: MUI (Material UI) và các component tuỳ chỉnh.
- **State & Auth**:
  - Context `AuthContext` để quản lý trạng thái đăng nhập admin.
  - Token JWT lưu trong `localStorage`, tự động attach vào header Authorization.
- **Kết nối backend**:
  - REST API client trong `src/api/client.ts` (dựa trên `VITE_API_URL`).
  - Socket client trong `src/api/socket.ts` (nếu dùng realtime).

---

## 2. Cấu trúc thư mục chính

- `src/`
  - `api/`
    - `client.ts`: Cấu hình HTTP client gọi API backend (Axios/fetch tuỳ implement).
    - `socket.ts`: Kết nối Socket.IO tới backend để nhận event realtime (nếu dùng).
  - `auth/`
    - `AuthContext.tsx`: Context quản lý trạng thái đăng nhập admin, token, logout.
  - `components/`
    - `Layout.tsx`: Layout chính (sidebar, topbar, container cho các page).
  - `pages/`
    - `DashboardPage.tsx`: Dashboard thống kê.
    - `ProductsPage.tsx`: CRUD sản phẩm.
    - `OrdersPage.tsx`: Quản lý đơn hàng.
    - `UsersPage.tsx`: Quản lý người dùng.
    - `VouchersPage.tsx`: Quản lý voucher.
    - `ReviewsPage.tsx`: Quản lý đánh giá sản phẩm.
    - `TransactionsPage.tsx`: Theo dõi giao dịch thanh toán.
    - `ShipmentsPage.tsx`: Theo dõi đơn vận chuyển.
    - `InventoryMovementsPage.tsx`: Nhập/xuất kho.
    - `NotificationsPage.tsx`: Gửi/xem thông báo.
    - `BannersPage.tsx`: Quản lý banner hiển thị trên app mobile.
    - `LoginPage.tsx`: Màn hình đăng nhập admin.
  - `hooks/`
    - `useDbChange.ts`: Hook kết nối realtime, lắng nghe thay đổi DB (ví dụ qua Socket.IO).
  - `utils/`
    - `slugify.ts`: Helper chuyển tên → slug dùng cho URL/code.
    - `uploads.ts`: Helper upload file/hình ảnh (thường kết hợp với Cloudinary).

---

## 3. Biến môi trường (`.env`)

Tạo file `electronics-admin/.env` (không commit lên Git) với:

```bash
VITE_API_URL=http://localhost:3000
```

- Đây là **base URL** để admin gọi API backend.
- Có thể thêm các biến dạng `VITE_*` khác nếu cần (ví dụ `VITE_UPLOAD_URL`, `VITE_SOCKET_URL`, v.v.).

---

## 4. Cài đặt & chạy dev

Yêu cầu:

- **Node.js**: khuyến nghị **>= 18**.
- Backend NestJS (`electronics-backend`) đang chạy ở `http://localhost:3000` (hoặc đúng URL bạn set trong `VITE_API_URL`).

Các bước:

```bash
cd electronics-admin

# Cài dependencies
npm install

# Chạy dev server (Vite)
npm run dev
```

Mặc định Vite sẽ chạy ở `http://localhost:5173`.

---

## 5. Build production

```bash
cd electronics-admin
npm run build
```

Kết quả build nằm trong thư mục `dist/`, có thể deploy lên bất kỳ static hosting nào (Nginx, Vercel, Netlify, S3 + CloudFront, v.v.).

---

## 6. Đăng nhập & phân quyền

- Để đăng nhập, cần một tài khoản user trên backend với `role` là `admin`.
  - Có thể tạo qua API `/users` hoặc đăng ký rồi cập nhật role trong DB.
- Sau khi đăng nhập:
  - JWT access token được lưu trong `localStorage`.
  - Mọi request tiếp theo sẽ tự động đính kèm header `Authorization: Bearer <token>`.
- Nếu token hết hạn hoặc bị revoke:
  - Tuỳ implement, ứng dụng sẽ redirect về `LoginPage` và yêu cầu đăng nhập lại.

