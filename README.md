# Electronics Admin

Giao diện quản trị cho backend Electronics Shop (NestJS). Ứng dụng dùng React + TypeScript + Vite + MUI để quản lý sản phẩm, đơn hàng, người dùng, voucher, đánh giá, vận chuyển, tồn kho và giao dịch.

## Chuẩn bị
- Node.js 18+
- Biến môi trường API: tạo file `.env` (hoặc export khi chạy) với `VITE_API_URL=http://localhost:3000`

## Chạy
```bash
npm install
npm run dev
```
Mặc định mở tại http://localhost:5173.

## Tài khoản
Đăng nhập bằng tài khoản có role `admin` trên backend. Token lưu trong localStorage.
