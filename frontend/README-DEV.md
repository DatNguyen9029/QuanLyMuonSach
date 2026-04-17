# Happy Library Frontend - Setup & Development Guide

## 📋 Yêu cầu

- **Node.js**: v16 trở lên (khuyến nghị v18+)
- **npm**: v8 trở lên
- **Backend API**: Chạy trên `http://localhost:3000`

## 🚀 Setup Ban Đầu

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Environment

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Cập nhật các biến môi trường theo cấu hình của bạn:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=Happy Library
VITE_ENABLE_DEBUG=true
```

### 3. Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

## 📦 Build cho Production

```bash
npm run build
```

Kết quả sẽ được lưu trong thư mục `dist/`

## 👀 Preview Build

```bash
npm run preview
```

## 📁 Cấu Trúc Thư Mục

```
src/
├── main.js                 # Entry point
├── App.vue                # Root component
├── pages/                 # Page views
│   ├── DashboardView.vue
│   ├── BookManagementView.vue
│   ├── BorrowManagementView.vue
│   ├── ChatView.vue
│   ├── ReaderManagementView.vue
│   └── auth/
│       ├── LoginView.vue
│       ├── RegisterView.vue
│       └── OAuthCallbackView.vue
│
├── components/            # Reusable components
│   ├── common/           # Shared components
│   ├── books/            # Book-specific components
│   ├── borrows/          # Borrow-specific components
│   ├── chat/             # Chat components
│   └── dashboard/        # Dashboard components
│
├── layouts/              # Layout components
│   ├── AuthLayout.vue    # For login/register page
│   └── MainLayout.vue    # For authenticated pages
│
├── router/               # Vue Router configuration
│   └── index.js
│
├── stores/               # Pinia state stores
│   ├── auth.store.js     # Authentication state
│   ├── book.store.js     # Books state
│   ├── borrow.store.js   # Borrow records state
│   └── reader.store.js   # User data state
│
├── services/             # API & external services
│   ├── api.js           # Axios instance
│   ├── api.service.js   # API endpoints wrapper
│   └── socket.js        # Socket.IO client
│
└── styles/              # Global styles
    ├── main.css         # Main styles + Tailwind directives
    └── fonts.css        # Font imports
```

## 🎨 Styling

- **Tailwind CSS v4**: Utility-first CSS framework
- **Custom components**: Defined in `src/styles/main.css`
- **Custom colors**: Primary, success, danger colors defined in `tailwind.config.js`

### Cách sử dụng Tailwind classes:

```vue
<template>
  <!-- Primary button -->
  <button class="btn btn-primary">Click me</button>

  <!-- Card container -->
  <div class="card">Content here</div>

  <!-- Responsive grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Items -->
  </div>
</template>
```

## 🔐 Authentication

- JWT token được lưu trong `localStorage` với key `hl_token`
- Auth store sẽ tự động gắn token vào request headers
- Token hết hạn (401) sẽ tự động logout người dùng
- Routes được bảo vệ bởi navigation guards

### Ví dụ sử dụng Auth Store:

```javascript
import { useAuthStore } from "@/stores/auth.store";

const authStore = useAuthStore();

// Check auth status
if (authStore.isAuthenticated) {
  console.log("Logged in as:", authStore.user.name);
}

// Login
await authStore.login(email, password);

// Logout
await authStore.logout();
```

## 🔌 API Integration

Sử dụng service layer để gọi API:

```javascript
import api from "@/services/api";

// Direct axios call
const response = await api.get("/books");

// Hoặc sử dụng wrapper service
import apiService from "@/services/api.service";
const books = await apiService.getBooks();
```

## 💬 Real-time Communication

Socket.IO được cấu hình trong `src/services/socket.js`:

```javascript
import socket from "@/services/socket";

// Listen to events
socket.on("new_message", (data) => {
  console.log("New message:", data);
});

// Emit events
socket.emit("send_message", { content: "Hello" });
```

## 🧪 Code Quality

### ESLint

Kiểm tra code style:

```bash
npm run lint
```

### Development Tools

- **Vite DevTools**: Plugin tích hợp cho debugging
- **Vue DevTools**: Dùng browser extension để debug Vue components
- **Network tab**: Kiểm tra API calls

## 🐛 Debugging

### 1. Browser DevTools

- F12 → Console để xem logs
- Network tab để kiểm tra API requests
- Application tab để xem localStorage

### 2. Vue DevTools

- Install extension từ: https://devtools.vuejs.org/
- Inspect components, check state, track events

### 3. Enable Debug Mode

Thêm vào `.env.local`:

```env
VITE_ENABLE_DEBUG=true
```

## 📝 Environment Variables

| Variable                | Default                   | Mô tả                    |
| ----------------------- | ------------------------- | ------------------------ |
| `VITE_API_BASE_URL`     | http://localhost:3000/api | Base URL của backend API |
| `VITE_SOCKET_URL`       | http://localhost:3000     | Socket.IO server URL     |
| `VITE_APP_NAME`         | Happy Library             | Tên ứng dụng             |
| `VITE_ENABLE_DEBUG`     | false                     | Bật debug mode           |
| `VITE_ENABLE_DEV_TOOLS` | true                      | Bật Vue DevTools         |

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build           # Build for production
npm run preview         # Preview build

# Code quality
npm run lint            # Check code style
npm run format          # Format code (nếu có config)
```

## 🤝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: describe your changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

## 🐛 Common Issues

### Issue: Port 5173 already in use

```bash
npm run dev -- --port 3002
```

### Issue: CORS error from API

- Kiểm tra `VITE_API_BASE_URL` trong `.env.local`
- Đảm bảo backend đã enable CORS
- Kiểm tra browser console cho chi tiết lỗi

### Issue: Token expired

- Logout và login lại
- Kiểm tra token trong localStorage (F12 → Application)

### Issue: Hot Module Replacement (HMR) không hoạt động

- Refresh page bằng F5
- Kiểm tra Vite config trong `vite.config.js`

## 📖 Further Learning

- [Vue 3 Docs](https://vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)

## 📞 Support

Nếu có vấn đề, vui lòng:

1. Kiểm tra console logs (F12)
2. Kiểm tra Network tab
3. Liên hệ dengan team lead

---

**Last Updated**: April 2026
