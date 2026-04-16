// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── REQUEST INTERCEPTOR: Đính kèm JWT token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hl_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── RESPONSE INTERCEPTOR: Xử lý lỗi toàn cục ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401: Token hết hạn hoặc không hợp lệ → đăng xuất
    if (status === 401) {
      localStorage.removeItem("hl_token");
      window.location.href = "/login";
    }

    // 403: Không có quyền
    if (status === 403) {
      window.location.href = "/403";
    }

    // Đẩy error message từ server lên để component xử lý
    const message = error.response?.data?.message || "Đã có lỗi xảy ra";
    return Promise.reject(new Error(message));
  },
);

export default api;
