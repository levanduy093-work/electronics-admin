# Electronics Admin - Hệ Thống Quản Trị Cửa Hàng Linh Kiện Điện Tử

## 📋 Giới Thiệu Chung

**Electronics Admin** là nền tảng quản trị trung tâm dành cho hệ thống cửa hàng kinh doanh linh kiện điện tử. Được xây dựng trên nền tảng công nghệ hiện đại với **React 19**, **TypeScript** và **Vite**, ứng dụng cung cấp một trải nghiệm quản lý mượt mà, nhanh chóng và hiệu quả.

Hệ thống được thiết kế để giải quyết toàn diện các bài toán quản lý vận hành: từ quản lý kho hàng phức tạp với hàng ngàn linh kiện, xử lý quy trình đơn hàng đa bước, đến việc chăm sóc khách hàng và phân tích hiệu quả kinh doanh.

### 📞 Thông Tin Liên Hệ & Hỗ Trợ
Nếu bạn cần hỗ trợ thêm về kỹ thuật, cấu hình file `.env` để chạy thử dự án, hoặc có thắc mắc chi tiết, vui lòng liên hệ:
- **Zalo**: [0827733475](https://zalo.me/0827733475)
- **Email**: [levanduy.work@gmail.com](mailto:levanduy.work@gmail.com)

---

## ✨ Tính Năng Chi Tiết

Hệ thống cung cấp đầy đủ các module quản trị chuyên sâu:

### 1. 📊 Dashboard (Bảng Điều Khiển Trung Tâm)
Nơi cung cấp cái nhìn tổng quan thời gian thực về sức khỏe của doanh nghiệp.
- **Thống kê tổng hợp**: Hiển thị số lượng sản phẩm, đơn hàng, tổng số người dùng, và lượt đánh giá.
- **Biểu đồ doanh thu**: (Dự kiến) Trực quan hóa doanh thu theo thời gian.
- **Đơn hàng mới nhất**: Danh sách các đơn hàng vừa phát sinh, giúp nhân viên xử lý nhanh chóng.
- **Real-time Updates**: Tự động cập nhật số liệu ngay khi có giao dịch mới thông qua kết nối Socket.IO.

### 2. 📦 Quản Lý Sản Phẩm (Products)
Module cốt lõi để quản lý danh mục linh kiện điện tử đa dạng.
- **Thông tin chi tiết**: Quản lý tên, mã SKU, giá bán, giá gốc, mô tả chi tiết.
- **Thông số kỹ thuật (Specs)**: Cho phép thêm động các trường thông số kỹ thuật (Ví dụ: Điện áp, Dòng điện, Kích thước) phù hợp với đặc thù linh kiện điện tử.
- **Quản lý hình ảnh**: Upload nhiều hình ảnh cho một sản phẩm, hỗ trợ xem trước (preview) và kéo thả.
- **Datasheet**: Đính kèm file PDF datasheet cho các linh kiện chuyên dụng.
- **Phân loại**: Gán danh mục (Category) để dễ dàng lọc và tìm kiếm trên app người dùng.

### 3. 📉 Quản Lý Tồn Kho (Inventory)
Kiểm soát chặt chẽ luồng hàng hóa ra vào kho.
- **Phiếu Nhập/Xuất Kho**: Tạo phiếu nhập kho (Inbound) khi nhập hàng từ nhà cung cấp và phiếu xuất kho (Outbound) khi bán hoặc hủy hàng.
- **Track Log**: Ghi lại lịch sử, lý do và người thực hiện mỗi lần thay đổi số lượng tồn kho.
- **Liên kết sản phẩm**: Tìm kiếm thông minh sản phẩm để làm phiếu kho theo tên hoặc mã.
- **Cảnh báo**: (Dự kiến) Hệ thống cảnh báo khi số lượng tồn kho xuống dưới mức tối thiểu.

### 4. 🛒 Quản Lý Đơn Hàng (Orders)
Quy trình xử lý đơn hàng khép kín và chuyên nghiệp.
- **Danh sách đơn hàng**: Xem tất cả đơn hàng với các bộ lọc thông minh (Ngày tạo, Trạng thái, Giá trị).
- **Quy trình trạng thái**: Cập nhật trạng thái đơn hàng theo luồng chuẩn:
  1. `pending` (Chờ xác nhận)
  2. `confirmed` (Đã xác nhận)
  3. `shipping` (Đang giao hàng)
  4. `delivered` (Giao thành công)
  5. `cancelled` (Đã hủy)
- **Chi tiết đơn hàng**: Xem danh sách sản phẩm, địa chỉ giao hàng, thông tin người nhận và phương thức thanh toán.

### 5. 👥 Quản Lý Người Dùng (Users)
Quản trị cơ sở dữ liệu khách hàng và nhân viên.
- **Danh sách người dùng**: Hiển thị thông tin email, tên, vai trò (Role).
- **Phân quyền**: Cấp quyền Admin hoặc User cho tài khoản.
- **Trạng thái hoạt động**: Khóa (Block) hoặc mở khóa người dùng vi phạm chính sách.

### 6. 🚚 Quản Lý Vận Chuyển (Shipments)
Theo dõi quá trình giao nhận hàng hóa.
- **Danh sách vận đơn**: Quản lý các đơn hàng đang trong quá trình vận chuyển.
- **Cập nhật tiến độ**: Ghi nhận trạng thái giao hàng từ đơn vị vận chuyển.
- **Tra cứu**: Tìm kiếm vận đơn để hỗ trợ khách hàng khiếu nại.

### 7. 🎫 Quản Lý Voucher (Khuyến Mãi)
Công cụ Marketing để thúc đẩy doanh số.
- **Tạo mã giảm giá**: Thiết lập mã code, phần trăm giảm giá hoặc số tiền giảm cố định.
- **Điều kiện áp dụng**: Quy định giá trị đơn hàng tối thiểu, số lượng mã tối đa.
- **Thời gian**: Cài đặt ngày bắt đầu và kết thúc chương trình khuyến mãi.
- **Trạng thái**: Kích hoạt hoặc tạm ngưng voucher ngay lập tức.

### 8. ⭐ Quản Lý Đánh Giá (Reviews)
Kiểm soát chất lượng và phản hồi từ khách hàng.
- **Duyệt đánh giá**: Xem các bình luận và số sao đánh giá của khách hàng về sản phẩm.
- **Kiểm duyệt**: Xóa các đánh giá spam hoặc không phù hợp/thô tục.
- **Phân tích**: Nắm bắt tâm lý khách hàng qua xu hướng đánh giá.

### 9. 💰 Quản Lý Giao Dịch (Transactions)
Theo dõi dòng tiền vào hệ thống.
- **Lịch sử thanh toán**: Ghi nhận các giao dịch thanh toán qua MoMo, Ngân hàng hoặc COD.
- **Trạng thái thanh toán**: Xác minh giao dịch thành công hay thất bại.
- **Đối soát**: Hỗ trợ kế toán đối soát doanh thu.

### 10. 🔔 Quản Lý Thông Báo (Notifications)
Hệ thống gửi tin nhắn đến người dùng.
- **Gửi thông báo đẩy (Push Notification)**: Gửi thông báo đến app mobile của khách hàng (Khuyến mãi mới, Tình trạng đơn hàng).
- **Lịch sử gửi**: Xem lại các thông báo đã gửi.

### 11. 🖼️ Quản Lý Banner
Tùy chỉnh giao diện hiển thị trên ứng dụng Mobile.
- **Slide Banner**: Thêm/Sửa/Xóa các banner quảng cáo chạy trên trang chủ App.
- **Điều hướng**: Gắn link sản phẩm hoặc danh mục vào banner để điều hướng người dùng.
- **Sắp xếp**: Thay đổi thứ tự xuất hiện của các banner.

---

## 🏗️ Kiến Trúc Hệ Thống

Dự án được tổ chức theo cấu trúc `feature-based` rõ ràng, giúp dễ dàng bảo trì và mở rộng:

```
electronics-admin/
├── src/
│   ├── api/                # Lớp giao tiếp với Backend (Axios, Socket.IO)
│   ├── auth/               # Context và Logic xử lý đăng nhập/phân quyền
│   ├── components/         # Các UI component tái sử dụng (Layout, Tables, Forms)
│   ├── hooks/              # Custom Hooks (useDbChange, useAuth...)
│   ├── pages/              # Các màn hình chức năng chính (Dashboard, Products, Orders...)
│   ├── utils/              # Các hàm tiện ích (Format tiền tệ, Xử lý ngày tháng, Upload ảnh)
│   ├── App.tsx             # Routing và cấu hình Theme
│   └── main.tsx            # Entry point
```

### Công Nghệ Sử Dụng

*   **Frontend Framework**: React 19
*   **Language**: TypeScript 5.9
*   **Build Tool**: Vite 7
*   **UI Library**: Material UI (MUI) v7 - Giao diện chuẩn Enterprise.
*   **State Management**: React Context API & Local State.
*   **Form Handling**: React Hook Form - Xử lý form hiệu năng cao.
*   **Data Fetching**: Axios (REST API).
*   **Real-time**: Socket.IO Client - Nhận cập nhật dữ liệu tức thì.
*   **Linting**: ESLint + Prettier - Đảm bảo chất lượng code.

---

## 🚀 Hướng Dẫn Cài Đặt và Chạy Ứng Dụng

*(Phần này được giữ nguyên theo hướng dẫn chuẩn của dự án)*

### 1. Clone repository

```bash
git clone <repository-url>
cd electronics-admin
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `electronics-admin`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
```

**Lưu ý:**
- `VITE_API_URL` là base URL của backend API
- Các biến môi trường phải bắt đầu với `VITE_` để Vite có thể expose chúng trong client code
- Đảm bảo backend API đang chạy và có thể truy cập từ URL này

### 4. Chạy ứng dụng

```bash
# Development mode
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng).

### 5. Build production

```bash
npm run build
```

Kết quả build sẽ nằm trong thư mục `dist/`, có thể deploy lên:
- **Static hosting**: Vercel, Netlify, GitHub Pages
- **Nginx**: Serve static files
- **CDN**: AWS S3 + CloudFront, Cloudflare Pages

### 6. Preview production build

```bash
npm run preview
```

## 🔐 Đăng nhập & Phân quyền

### Tạo tài khoản Admin

Để đăng nhập vào admin panel, bạn cần một tài khoản với role `admin`:

1. **Tạo qua API** (nếu backend hỗ trợ):
   ```bash
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "password123",
       "name": "Admin User",
       "role": "admin"
     }'
   ```

2. **Hoặc cập nhật role trong database**:
   - Tìm user trong MongoDB collection `users`
   - Cập nhật field `role` thành `"admin"`

### Authentication Flow

1. **Đăng nhập**: Nhập email và password tại `/login`
2. **Token Storage**: 
   - Access token được lưu trong `localStorage` với key `token`
   - Refresh token được lưu với key `refreshToken`
   - User info được lưu với key `user`
3. **Auto Attach Token**: Mọi request sẽ tự động đính kèm header `Authorization: Bearer <token>`
4. **Token Refresh**: Nếu token hết hạn (401), hệ thống sẽ tự động refresh token
5. **Logout**: Xóa tokens và redirect về `/login`

---

## ⚠️ Lưu ý quan trọng

### CORS Configuration

Đảm bảo backend API đã cấu hình CORS để cho phép requests từ admin frontend:

```typescript
// Backend (NestJS)
app.enableCors({
  origin: ['http://localhost:5173', 'https://your-admin-domain.com'],
  credentials: true,
})
```

---

Dự án được xây dựng và bảo trì bởi team phát triển **Electronics Shop**. Mọi đóng góp và ý kiến phản hồi đều được hoan nghênh.
