# Electronics Admin - Trang Quản Trị Cửa Hàng Linh Kiện Điện Tử

## 📋 Tổng quan

Electronics Admin là một ứng dụng web quản trị được xây dựng bằng React + TypeScript + Vite, dùng để quản lý toàn bộ hệ thống cửa hàng linh kiện điện tử. Ứng dụng cung cấp giao diện quản trị đầy đủ với Material-UI, tích hợp với backend NestJS và hỗ trợ cập nhật thời gian thực qua Socket.IO.

## ✨ Tính năng chính

### 📊 Dashboard
- **Tổng quan hệ thống**: Hiển thị thống kê tổng hợp về sản phẩm, đơn hàng, người dùng, vouchers, đánh giá
- **Doanh thu**: Ước tính doanh thu từ tất cả đơn hàng
- **Đơn hàng mới nhất**: Bảng danh sách 5 đơn hàng gần nhất với trạng thái chi tiết
- **Real-time Updates**: Cập nhật dữ liệu theo thời gian thực qua Socket.IO

### 📦 Quản lý Sản phẩm
- **CRUD đầy đủ**: Tạo, đọc, cập nhật, xóa sản phẩm
- **Upload hình ảnh**: Hỗ trợ upload nhiều hình ảnh với preview
- **Quản lý tồn kho**: Theo dõi và cập nhật số lượng tồn kho
- **Thông số kỹ thuật**: Thêm/sửa thông số kỹ thuật động (specs)
- **Phân loại**: Quản lý danh mục, options, và classifications
- **Datasheet**: Upload và quản lý file datasheet
- **Tìm kiếm**: Tìm kiếm sản phẩm theo tên hoặc mã sản phẩm

### 🛒 Quản lý Đơn hàng
- **Xem danh sách**: Hiển thị tất cả đơn hàng với DataGrid
- **Chi tiết đơn hàng**: Xem thông tin chi tiết về đơn hàng
- **Cập nhật trạng thái**: Thay đổi trạng thái đơn hàng (Đã đặt, Đã xác nhận, Đóng gói, Đang giao, Đã giao)
- **Lọc và sắp xếp**: Lọc theo trạng thái, ngày tháng, thanh toán
- **Theo dõi thanh toán**: Xem trạng thái thanh toán của từng đơn hàng

### 👥 Quản lý Người dùng
- **Danh sách người dùng**: Xem tất cả người dùng đã đăng ký
- **Thông tin chi tiết**: Xem thông tin cá nhân, địa chỉ, lịch sử đơn hàng
- **Phân quyền**: Quản lý vai trò người dùng (admin, user)
- **Khóa/Mở khóa**: Quản lý trạng thái tài khoản người dùng

### 🎫 Quản lý Voucher
- **Tạo voucher**: Tạo mã giảm giá với các loại khác nhau
- **Cấu hình**: Thiết lập giá trị giảm giá, điều kiện áp dụng, thời hạn
- **Theo dõi sử dụng**: Xem số lần đã sử dụng và còn lại
- **Kích hoạt/Vô hiệu hóa**: Bật/tắt voucher

### ⭐ Quản lý Đánh giá
- **Xem đánh giá**: Danh sách tất cả đánh giá từ người dùng
- **Phê duyệt/Xóa**: Quản lý đánh giá không phù hợp
- **Phân tích**: Xem rating trung bình của sản phẩm

### 💰 Quản lý Giao dịch
- **Theo dõi thanh toán**: Xem tất cả giao dịch thanh toán
- **Lọc theo phương thức**: MoMo, COD, ATM/Internet Banking
- **Trạng thái thanh toán**: Đã thanh toán, Chờ thanh toán, Thất bại
- **Xuất báo cáo**: Export dữ liệu giao dịch

### 🚚 Quản lý Vận chuyển
- **Theo dõi đơn vận chuyển**: Quản lý các đơn hàng đang vận chuyển
- **Cập nhật trạng thái**: Cập nhật tiến trình giao hàng
- **Thông tin vận chuyển**: Xem thông tin đơn vị vận chuyển, mã vận đơn

### 📦 Quản lý Tồn kho
- **Nhập/Xuất kho**: Ghi nhận các giao dịch nhập xuất kho
- **Lịch sử**: Xem lịch sử thay đổi tồn kho
- **Báo cáo**: Thống kê tồn kho theo thời gian
- **Cảnh báo**: Thông báo khi tồn kho thấp

### 🔔 Quản lý Thông báo
- **Gửi thông báo**: Tạo và gửi thông báo đến người dùng
- **Push Notifications**: Gửi thông báo đẩy qua FCM
- **Lịch sử**: Xem lịch sử các thông báo đã gửi
- **Mẫu thông báo**: Tạo và lưu mẫu thông báo

### 🖼️ Quản lý Banner
- **Tạo banner**: Tạo banner hiển thị trên app mobile
- **Upload hình ảnh**: Upload và quản lý hình ảnh banner
- **Cấu hình**: Thiết lập link, thứ tự hiển thị, thời gian hiển thị
- **Kích hoạt/Vô hiệu hóa**: Bật/tắt banner

## 🏗️ Kiến trúc dự án

### Cấu trúc thư mục

```
electronics-admin/
├── public/                 # Tài nguyên tĩnh
│   └── vite.svg
├── src/
│   ├── api/                # API clients
│   │   ├── client.ts       # Axios client với interceptors
│   │   └── socket.ts       # Socket.IO client cho real-time
│   ├── assets/             # Assets (images, icons)
│   │   └── react.svg
│   ├── auth/               # Authentication
│   │   └── AuthContext.tsx # Context quản lý auth state
│   ├── components/         # Components tái sử dụng
│   │   └── Layout.tsx      # Layout chính (sidebar, topbar)
│   ├── hooks/              # Custom React hooks
│   │   └── useDbChange.ts  # Hook lắng nghe DB changes
│   ├── pages/              # Các trang chính
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── VouchersPage.tsx
│   │   ├── ReviewsPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── ShipmentsPage.tsx
│   │   ├── InventoryMovementsPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── BannersPage.tsx
│   │   └── LoginPage.tsx
│   ├── utils/              # Utility functions
│   │   ├── slugify.ts      # Chuyển đổi tên thành slug
│   │   └── uploads.ts      # Helper upload files/images
│   ├── App.tsx             # Root component với routing
│   ├── App.css             # Global styles
│   ├── index.css           # Base styles
│   └── main.tsx            # Entry point
├── .gitignore
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML template
├── package.json            # Dependencies và scripts
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # TypeScript config cho app
├── tsconfig.node.json      # TypeScript config cho Node
└── vite.config.ts          # Vite configuration
```

### Luồng điều hướng

- **Login**: `/login` - Màn hình đăng nhập
- **Protected Routes**: Tất cả routes khác yêu cầu authentication và role admin
- **Dashboard**: `/` - Trang tổng quan
- **Products**: `/products` - Quản lý sản phẩm
- **Orders**: `/orders` - Quản lý đơn hàng
- **Shipments**: `/shipments` - Quản lý vận chuyển
- **Inventory**: `/inventory` - Quản lý tồn kho
- **Transactions**: `/transactions` - Quản lý giao dịch
- **Users**: `/users` - Quản lý người dùng
- **Vouchers**: `/vouchers` - Quản lý voucher
- **Reviews**: `/reviews` - Quản lý đánh giá
- **Notifications**: `/notifications` - Quản lý thông báo
- **Banners**: `/banners` - Quản lý banner

## 🛠️ Công nghệ sử dụng

### Core
- **React**: 19.2.0
- **TypeScript**: ~5.9.3
- **Vite**: ^7.2.4
- **Node.js**: >= 18

### UI Framework
- **Material-UI (MUI)**: ^7.3.7
  - `@mui/material`: Core components
  - `@mui/icons-material`: Material icons
  - `@mui/x-data-grid`: Data grid component cho tables
  - `@emotion/react` & `@emotion/styled`: CSS-in-JS styling

### Routing & Forms
- **react-router-dom**: ^7.12.0 - Client-side routing
- **react-hook-form**: ^7.70.0 - Form management và validation

### HTTP Client & Real-time
- **axios**: ^1.13.2 - HTTP client với interceptors
- **socket.io-client**: ^4.8.3 - WebSocket client cho real-time updates

### Development Tools
- **ESLint**: ^9.39.1 - Code linting
- **TypeScript ESLint**: ^8.46.4 - TypeScript linting
- **Vite**: Build tool và dev server

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 18 (khuyến nghị >= 20)
- **npm** hoặc **yarn**
- **Backend API**: Electronics Backend (NestJS) đang chạy và có thể truy cập

## 🚀 Cài đặt và chạy ứng dụng

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

# Optional: Socket.IO URL (defaults to VITE_API_URL)
VITE_SOCKET_URL=http://localhost:3000

# Optional: Upload service URL (if different from API)
VITE_UPLOAD_URL=https://api.cloudinary.com/v1_1/your-cloud-name
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

### Protected Routes

Tất cả routes ngoại trừ `/login` đều được bảo vệ:
- Yêu cầu `isAuthenticated === true`
- Yêu cầu `user.role === 'admin'`
- Nếu không đáp ứng, sẽ redirect về `/login`

## 📡 API Integration

### API Client (`src/api/client.ts`)

API client được cấu hình với Axios và có các tính năng:

- **Base URL**: Từ `VITE_API_URL` environment variable
- **Request Interceptor**: Tự động attach JWT token vào header
- **Response Interceptor**: 
  - Tự động refresh token khi nhận 401
  - Logout và redirect khi nhận 403 (forbidden)
  - Xử lý lỗi một cách nhất quán

### Socket.IO Client (`src/api/socket.ts`)

Socket client được sử dụng cho real-time updates:
- Kết nối tự động khi app khởi động
- Lắng nghe các events từ backend
- Tự động reconnect khi mất kết nối

### Sử dụng trong Components

```typescript
import client from '../api/client'

// GET request
const response = await client.get('/products')
const products = response.data

// POST request
const response = await client.post('/products', {
  name: 'New Product',
  price: 100000
})

// PUT request
const response = await client.put(`/products/${id}`, {
  name: 'Updated Product'
})

// DELETE request
await client.delete(`/products/${id}`)
```

## 🎨 UI Components

### Material-UI Theme

Theme được cấu hình trong `App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#10b981' },
    background: { default: '#f3f4f6' },
  },
  shape: {
    borderRadius: 12,
  },
})
```

### Layout Component

Layout component (`src/components/Layout.tsx`) bao gồm:
- **Sidebar**: Navigation menu với các trang chính
- **Topbar**: Header với user info và logout button
- **Responsive**: Tự động thu gọn sidebar trên mobile

### Data Grid

Sử dụng `@mui/x-data-grid` cho các bảng dữ liệu:
- Sorting, filtering, pagination
- Custom cell renderers
- Row selection
- Export data

## 🔄 Real-time Updates

### useDbChange Hook

Hook `useDbChange` (`src/hooks/useDbChange.ts`) được sử dụng để lắng nghe thay đổi database:

```typescript
import { useDbChange } from '../hooks/useDbChange'

function ProductsPage() {
  useDbChange('products', () => {
    // Reload products when DB changes
    fetchProducts()
  })
  
  // ...
}
```

### Socket Events

Backend có thể emit các events sau:
- `db:change`: Thông báo khi có thay đổi trong database
- `order:updated`: Cập nhật đơn hàng
- `product:updated`: Cập nhật sản phẩm
- `notification:new`: Thông báo mới

## 📤 File Upload

### Upload Utilities (`src/utils/uploads.ts`)

Hỗ trợ upload files và images:
- `uploadImageFiles()`: Upload từ File objects
- `uploadImageUrls()`: Upload từ URLs
- Tích hợp với Cloudinary hoặc backend upload endpoint

### Sử dụng

```typescript
import { uploadImageFiles } from '../utils/uploads'

const files = [file1, file2, file3]
const uploadedUrls = await uploadImageFiles(files)
// Returns: ['https://cloudinary.com/image1.jpg', ...]
```

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking (via TypeScript)
npm run build
```

## 📝 Scripts có sẵn

- `npm run dev`: Chạy development server (Vite)
- `npm run build`: Build production bundle
- `npm run preview`: Preview production build
- `npm run lint`: Chạy ESLint để kiểm tra code

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

### Environment Variables

- Không commit file `.env` lên Git
- Sử dụng `.env.example` để document các biến cần thiết
- Trong production, cấu hình environment variables trên hosting platform

### Security

- **JWT Tokens**: Tokens được lưu trong localStorage (có thể cân nhắc httpOnly cookies)
- **HTTPS**: Luôn sử dụng HTTPS trong production
- **Input Validation**: Validate input cả ở frontend và backend
- **Rate Limiting**: Backend nên implement rate limiting cho API endpoints

### Performance

- **Code Splitting**: Vite tự động code splitting theo routes
- **Lazy Loading**: Có thể lazy load các pages để giảm bundle size
- **Image Optimization**: Sử dụng Cloudinary hoặc CDN cho images
- **Caching**: Implement caching cho API responses khi phù hợp

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Vấn đề**: Browser chặn requests do CORS policy

**Giải pháp**:
- Kiểm tra backend CORS configuration
- Đảm bảo `VITE_API_URL` đúng với backend URL
- Kiểm tra network tab trong DevTools để xem request headers

#### 2. Token Expired / 401 Errors

**Vấn đề**: Token hết hạn hoặc không hợp lệ

**Giải pháp**:
- Kiểm tra token trong localStorage
- Đăng nhập lại nếu token không thể refresh
- Kiểm tra backend token expiration settings

#### 3. Socket Connection Failed

**Vấn đề**: Socket.IO không kết nối được

**Giải pháp**:
- Kiểm tra `VITE_SOCKET_URL` hoặc `VITE_API_URL`
- Đảm bảo backend Socket.IO server đang chạy
- Kiểm tra firewall và network settings

#### 4. Build Errors

**Vấn đề**: Build production thất bại

**Giải pháp**:
```bash
# Clear cache và rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### 5. Module Not Found

**Vấn đề**: Import errors hoặc module không tìm thấy

**Giải pháp**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tài liệu tham khảo

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Material-UI Documentation](https://mui.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)

## 📄 License

Private project - All rights reserved

## 👥 Đóng góp

Dự án này được phát triển như một phần của khóa học Mobile Development.

---

**Lưu ý**: Để sử dụng đầy đủ các tính năng, bạn cần có backend API (`electronics-backend`) đang chạy và có thể truy cập được. Xem thêm README của backend để biết cách setup và chạy backend.
