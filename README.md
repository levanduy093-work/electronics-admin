# ElectronicsShop Admin

Admin dashboard để quản trị toàn bộ hệ thống ElectronicsShop: sản phẩm, đơn hàng, tồn kho, thanh toán, banner và thông báo.

## Tech Stack
- Vite + React
- MUI
- TanStack Query
- Socket.IO client

## Cấu hình môi trường
Tạo `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Cài đặt và chạy
```bash
npm install
npm run dev
```

## Module quản trị
- Dashboard tổng quan
- Products + Product Detail
- Orders + Order Detail
- Shipments
- Inventory Movements
- Transactions
- Users
- Vouchers
- Reviews
- Notifications
- Banners

## Flow tổng thể (Admin)
```mermaid
flowchart TD
  A[Login admin] --> B[Load dashboard]
  B --> C[CRUD Products]
  B --> D[Manage Orders]
  B --> E[Manage Inventory]
  B --> F[Manage Shipments]
  B --> G[Manage Transactions]
  B --> H[Manage Users/Vouchers/Reviews]
  B --> I[Manage Notifications/Banners]
```

## Flow Orders + Shipments
```mermaid
flowchart TD
  O1[Open Orders] --> O2[Select Order]
  O2 --> O3[Update status / cancel / rollback]
  O3 --> S1[Backend sync shipment]
  S1 --> S2[Shipment status history]
```

## Flow Inventory
```mermaid
flowchart TD
  I1[Create movement inbound/outbound] --> I2[Backend update stock]
  I2 --> I3[Movement recorded]
```

## Realtime DB Change
```mermaid
flowchart TD
  A1[Socket connect with JWT] --> A2[Join admin room]
  A2 --> A3[Receive db_change events]
  A3 --> A4[Refresh tables]
```

## Ghi chú
- Cần tài khoản role `admin`.
- Admin app tự refresh token qua `/auth/refresh` khi access token hết hạn.
- Backend cần cấu hình CORS cho domain admin.

## Liên quan
- Backend: `/Users/levanduy/Nam4/HK2/Mobile/ElectroAI/electronics-backend/README.md`
- Mobile: `/Users/levanduy/Nam4/HK2/Mobile/ElectroAI/ElectronicsShop/README.md`
- Tổng quan hệ thống: `/Users/levanduy/Nam4/HK2/Mobile/ElectroAI/readme.md`
