import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
});

// Request interceptor: tự động đính kèm JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hl_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: xử lý lỗi 401 toàn cục
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("hl_token");
      localStorage.removeItem("hl_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
