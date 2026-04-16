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
    const status = error.response?.status;
    const shouldRedirectOnForbidden = error.config?.redirectOnForbidden;

    if (status === 401) {
      localStorage.removeItem("hl_token");
      window.location.href = "/auth/login";
    }

    if (status === 403 && shouldRedirectOnForbidden) {
      window.location.href = "/403";
    }

    const message = error.response?.data?.message || "Đã có lỗi xảy ra";
    return Promise.reject(new Error(message));
  },
);

export default api;
