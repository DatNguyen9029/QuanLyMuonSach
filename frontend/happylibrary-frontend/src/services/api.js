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

// ── SIMPLE CACHE FOR GET REQUESTS ──────────────────────────────────────
const cache = new Map();

function getCacheKey(config) {
  if (config.method !== "get") return null;
  const params = new URLSearchParams(config.params).toString();
  return config.url + "?" + params;
}

// ── REQUEST INTERCEPTOR: Đính kèm JWT token + Cache check ──────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hl_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests (5min TTL)
    const cacheKey = getCacheKey(config);
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) {
        return Promise.resolve(cached.response);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── RESPONSE INTERCEPTOR: Cache GET + Error handling ─────────────────────
api.interceptors.response.use(
  (response) => {
    const cacheKey = getCacheKey(response.config);
    if (cacheKey) {
      cache.set(cacheKey, { response, timestamp: Date.now() });
    }
    return response;
  },
  (error) => {
    // Lấy thông báo lỗi từ Server nếu có, nếu không thì dùng mặc định
    const serverMessage = error.response?.data?.message;
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("hl_token");
      window.location.href = "/login";
    }

    // Quan trọng: Trả về message cụ thể để Store có thể bắt được
    const finalError = new Error(serverMessage || "Đã có lỗi xảy ra");
    finalError.status = status;

    return Promise.reject(finalError);
  },
);

export default api;
