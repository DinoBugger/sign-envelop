# Node Auth System

Hệ thống xác thực cơ bản viết bằng Node.js + Express + MongoDB với frontend React + Vite để test nhanh.

## Cấu trúc dự án

```
node-auth-system/
├── backend/                    # Server Express
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # Kết nối MongoDB
│   │   ├── controllers/
│   │   │   └── authController.js  # Xử lý register/login/verify-otp/refresh/logout
│   │   ├── models/
│   │   │   ├── User.js        # Schema User (username, email, password)
│   │   │   ├── OTP.js         # Schema OTP (email, otp_code, status, action_type)
│   │   │   └── RefreshToken.js # Schema RefreshToken
│   │   ├── routers/
│   │   │   ├── authRouter.js  # Routes auth
│   │   │   └── index.js       # Main router
│   │   └── server.js          # Entry point
│   └── package.json
└── frontend/                   # Frontend React + Vite
    ├── index.html             # Vite entry HTML
    ├── package.json           # Frontend scripts/dependencies
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        ├── contexts/
        ├── hooks/
        ├── layouts/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── OTPVerifyPage.jsx   # Trang xác thực OTP
        │   └── NotFoundPage.jsx
        ├── services/
        └── utils/
```

## Yêu cầu

- **Node.js** 18+
- **npm** hoặc **yarn**
- **MongoDB** (local hoặc cloud)

## Cài đặt và luồng chạy

### 1. Cài dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

### 2. Tạo file `.env` trong `backend`

```bash
# backend/.env
MONGO_URI=mongodb://localhost:27017
ACCESS_TOKEN_SECRET=your-super-secret-key-change-this
REFRESH_TOKEN_SECRET=your-refresh-token-secret-key-change-this
PORT=8080
NODE_ENV=dev
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Node Auth System
CORS_ORIGINS=http://localhost:5173
```

Lưu ý:

- `ACCESS_TOKEN_SECRET` và `REFRESH_TOKEN_SECRET` là bắt buộc.
- `RESEND_API_KEY` là bắt buộc để bật tính năng gửi mail qua Resend.
- `RESEND_FROM_EMAIL` nên là sender đã xác thực trong Resend. Nếu không đặt, hệ thống dùng `onboarding@resend.dev`.
- `RESEND_FROM_NAME` là tên hiển thị của người gửi.

### 2b. Tạo file `.env` trong `frontend`

```bash
# frontend/.env
BACKEND_BASE_URL=http://localhost:8080
```

Khi host frontend trên platform khác (Vercel, Netlify, v.v.), cập nhật `BACKEND_BASE_URL` thành URL của backend:

```bash
# Ví dụ: Backend hosted trên Render hoặc Railway
BACKEND_BASE_URL=https://your-backend-api.com
```

**Lưu ý:**

- Default (nếu không đặt `.env`): `http://localhost:8080`
- Frontend sẽ tự động thêm `/api` vào trước các endpoint (ví dụ: `/auth/login` → `{BACKEND_BASE_URL}/api/auth/login`)
- Mặc định `frontend/vite.config.js` đang proxy `/api` sang `http://localhost:8080` trong development.
- Nếu bạn muốn backend chạy cổng khác (ví dụ `8000`), hãy đổi `target` trong `frontend/vite.config.js` cho khớp.

### Resend Mail Service / Email Configuration

Backend sử dụng Nodemailer để gửi email. Các tính năng:

**Gửi email chào mừng:**

- Được gửi sau khi OTP được xác thực thành công
- Hàm: `sendWelcomeEmail(user)`

**Gửi OTP:**

- Được gửi khi người dùng đăng ký hoặc yêu cầu reset password
- Hàm: `sendOtpEmail({ email, otpCode, actionType })`
  - `actionType`: "REGISTER" hoặc "RESET_PASSWORD"
  - OTP hết hạn sau 180 giây

**Cấu hình SMTP trong `.env`:**

```bash
SMTP_SERVICE=gmail  # hoặc các dịch vụ khác
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Node Auth System
```

### CORS Configuration (Nếu host frontend riêng biệt)

Khi frontend được host trên một domain/URL khác (Vercel, Netlify, v.v.), cần cấu hình CORS để backend chấp nhận request từ frontend.

**Cách cấu hình:**

Thêm biến `CORS_ORIGINS` vào file `.env` backend:

```bash
# backend/.env
CORS_ORIGINS=https://your-frontend-domain.com,https://another-frontend.vercel.app
```

**Ví dụ:**

```bash
# Một domain
CORS_ORIGINS=https://sign-envelop.vercel.app

# Nhiều domains (tách bằng dấu phẩy)
CORS_ORIGINS=https://sign-envelop.vercel.app,https://app.example.com,https://staging.example.com

# Development + Production
CORS_ORIGINS=http://localhost:5173,https://sign-envelop.vercel.app
```

**Lưu ý:**

- Các domains được tự động thêm vào danh sách origins cho phép
- Luôn nhớ **restart backend server** sau khi cập nhật `.env`
- Default đã hỗ trợ: `http://localhost:5173` (Vite dev) và `http://127.0.0.1:5173`
- HttpOnly cookie (refresh token) sẽ tự động được gửi cùng request từ browser
- Ensure frontend API URL được cấu hình đúng (ví dụ: `https://your-backend-api.com/api`)

### 3. Luồng chạy Development (khuyến nghị)

Mở 2 terminal riêng:

```bash
# Terminal 1 - backend
cd backend
npm run dev
```

```bash
# Terminal 2 - frontend
cd frontend
npm run dev
```

Truy cập:

```
http://localhost:5173
```

Khi chạy theo luồng này:

- Frontend gọi API qua `/api/*`.
- Vite dev server proxy request sang backend (`localhost:8080` theo cấu hình hiện tại).
- Access token được giữ trong memory (React state), không lưu localStorage.
- Refresh token nằm trong HttpOnly cookie để khôi phục phiên qua `/api/auth/refresh`.

### 4. Luồng chạy Production (serve từ backend)

```bash
# Build frontend
cd frontend
npm run build

# Run backend
cd ..\backend
npm start
```

Sau khi build, backend sẽ tự serve static files từ `frontend/dist` (nếu tồn tại) và trả `index.html` cho các route không phải `/api`.

## Validation Input

Backend kiểm tra dữ liệu input:

### Username

- ✅ Chuỗi bất kỳ (không ép email)
- ❌ Không được để trống
- ❌ Ít nhất 3 ký tự
- ❌ Không vượt quá 50 ký tự
- ❌ Phải là duy nhất (không trùng trong DB)

### Email

- ✅ Phải đúng định dạng email
- ❌ Không được để trống
- ❌ Không vượt quá 254 ký tự
- ❌ Phải là duy nhất (không trùng trong DB)

### Password

- ✅ Chuỗi bất kỳ
- ❌ Không được để trống
- ❌ Ít nhất 6 ký tự
- ❌ Không vượt quá 128 ký tự

## Hệ thống Token

Hệ thống xác thực sử dụng **JWT (JSON Web Token)** với 2 loại token:

### Access Token

- **Thời gian hết hạn:** 15 phút
- **Cách sử dụng:** Gửi trong header `Authorization: Bearer <accessToken>`
- **Dùng cho:** Xác minh danh tính khi truy cập các API được bảo vệ

### Refresh Token

- **Thời gian hết hạn:** 7 ngày
- **Lưu trữ:** Được lưu trong cookie `refreshToken` (HttpOnly)
- **Dùng cho:** Cấp một access token mới khi access token hết hạn
- **Bảo mật:** HttpOnly cookie ngăn chặn truy cập từ JavaScript

### Quy trình làm mới token

1. Frontend gọi `/api/auth/refresh` khi access token hết hạn
2. Server xác minh refresh token từ cookie
3. Server trả về access token mới
4. Frontend sử dụng access token mới để tiếp tục các request

## API Endpoints

### 1. Register (Gửi OTP)

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "data": {
    "username": "john",
    "email": "john@example.com",
    "password": "password123"
  }
}
```

**Error (400):**

```json
{
  "message": "Tên đăng nhập đã tồn tại!"
}
```

```json
{
  "message": "Email already exists!"
}
```

### 2. Verify OTP (Xác thực OTP)

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp_code": "123456",
  "username": "john",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "message": "Registration successful!",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john",
    "email": "john@example.com"
  }
}
```

**Error (400):**

```json
{
  "message": "Invalid OTP code."
}
```

```json
{
  "message": "Too many attempts. Please request a new OTP."
}
```

### 3. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "message": "Login successful!",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (400):**

```json
{
  "message": "Sai email hoặc mật khẩu!"
}
```

### 4. Get Profile

```http
GET /api/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "message": "Chào mừng bạn đến với trang cá nhân!",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john",
    "email": "john@example.com"
  }
}
```

**Error (401):**

```json
{
  "message": "Bạn chưa đăng nhập!"
}
```

**Error (403):**

```json
{
  "message": "Token không hợp lệ hoặc đã hết hạn!"
}
```

### 5. Refresh Access Token

```http
POST /api/auth/refresh
```

**Mô tả:** Dùng refresh token (được lưu trong cookie) để cấp một access token mới  
**Điều kiện:** Refresh token phải được gửi trong cookie `refreshToken`

**Response (200):**

```json
{
  "message": "Token làm mới thành công!",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**

```json
{
  "message": "Refresh token không hợp lệ hoặc đã hết hạn!"
}
```

### 6. Logout

```http
POST /api/auth/logout
```

**Mô tả:** Xóa refresh token khỏi cookie và hủy phiên đăng nhập  
**Điều kiện:** Refresh token phải được gửi trong cookie `refreshToken`

**Response (200):**

```json
{
  "message": "Đăng xuất thành công!"
}
```

**Error (400):**

```json
{
  "message": "Không có refresh token để xóa!"
}
```

## Luồng Đăng Ký Mới (OTP Verification)

1. **Người dùng nhập thông tin** (username, email, password) tại trang `/register`
2. **Frontend gửi request** đến `POST /api/auth/register`
3. **Backend xác nhận dữ liệu** và:
   - Tạo OTP 6 chữ số ngẫu nhiên
   - Lưu OTP vào MongoDB với TTL 180 giây
   - Gửi OTP qua email
   - Trả về status 200 với dữ liệu tạm thời
4. **Frontend lưu dữ liệu vào localStorage** và điều hướng đến `/verify-otp`
5. **Người dùng nhập OTP** từ email vào trang OTPVerifyPage
6. **Frontend gửi request** đến `POST /api/auth/verify-otp` với:
   - email, otp_code, username, password
7. **Backend xác thực OTP**:
   - Kiểm tra OTP có hợp lệ không
   - Giới hạn 5 lần thử
   - Hash password và tạo tài khoản
   - Gửi email chào mừng
8. **Frontend xóa dữ liệu localStorage** và điều hướng đến `/login`
9. **Người dùng đăng nhập bình thường**

## OTP Schema

```json
{
  "email": "string (required, unique per action_type)",
  "otp_code": "string (6 digits)",
  "action_type": "string (REGISTER | RESET_PASSWORD)",
  "status": "string (PENDING | USED)",
  "attempts_count": "number (default: 0)",
  "createdAt": "date (TTL: 180 seconds)"
}
```

**Đặc điểm:**

- ✅ Auto-delete sau 180 giây (3 phút)
- ✅ Tối đa 5 lần thử OTP
- ✅ Đánh dấu USED sau khi xác thực thành công
- ✅ Compound index (email + action_type) cho tìm kiếm nhanh

## Troubleshooting

### ❌ Lỗi: "Cấu hình server thiếu ACCESS_TOKEN_SECRET"

**Nguyên nhân:** Biến môi trường `ACCESS_TOKEN_SECRET` chưa được thiết lập  
**Giải pháp:** Thêm `ACCESS_TOKEN_SECRET` vào file `.env`

```bash
ACCESS_TOKEN_SECRET=your-secret-key
```

### ❌ Lỗi: "Cấu hình server thiếu REFRESH_TOKEN_SECRET"

**Nguyên nhân:** Biến môi trường `REFRESH_TOKEN_SECRET` chưa được thiết lập  
**Giải pháp:** Thêm `REFRESH_TOKEN_SECRET` vào file `.env`

```bash
REFRESH_TOKEN_SECRET=your-refresh-secret-key
```

### ❌ Lỗi: "Kết nối đến MongoDB thất bại"

**Nguyên nhân:** MongoDB không chạy hoặc URI sai  
**Giải pháp:**

- Nếu dùng local: Chắc chắn MongoDB service đang chạy
  ```bash
  # Windows
  net start MongoDB
  # Mac
  brew services start mongodb-community
  ```
- Nếu dùng MongoDB Atlas: Kiểm tra URI trong file `.env`

### ❌ Lỗi: "CORS"

**Nguyên nhân:** Frontend gọi API từ domain khác  
**Giải pháp:** Backend đã bật CORS, nhưng nếu vẫn có lỗi, thử:

- Kiểm tra `API Base URL` trong frontend có đúng không
- Chắc chắn server backend đang chạy

### ❌ Mất access token sau khi reload trang

**Nguyên nhân:** Access token được lưu trong memory (state), không lưu localStorage.  
**Giải pháp:** Đây là hành vi bình thường. Ứng dụng sẽ gọi `/api/auth/refresh` để khôi phục phiên từ refresh token cookie.

## Phát triển thêm

### Chạy backend ở chế độ watch (tự reload)

```bash
npm run dev
```

Dùng `nodemon` để tự động restart server khi code thay đổi.

### Test API bằng cURL

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get Profile (thay TOKEN bằng token từ login)
curl -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer TOKEN"

# Refresh Access Token (refresh token được gửi qua cookie tự động)
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json"

# Logout (xóa refresh token khỏi cookie)
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Content-Type: application/json"
```

### Test API bằng Postman

1. Tạo Request POST đến `http://localhost:8080/api/auth/login`
2. Vào tab **Body** → chọn **raw** → **JSON**
3. Nhập:
   ```json
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```
4. Nhấn **Send**

## Liên hệ & Hỗ trợ

Nếu gặp vấn đề, kiểm tra:

- Console server (terminal chạy backend) có lỗi gì không
- Console browser (F12 → Console) có warning không
- File `.env` có đủ biến không
