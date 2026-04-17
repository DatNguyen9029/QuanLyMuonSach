// src/stores/auth.store.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  const user = ref(null);
  const token = ref(localStorage.getItem("hl_token") || null);
  const userLastFetch = ref(0); // Timestamp for caching

  // ─── GETTERS ───────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isUserFresh = computed(() => Date.now() - userLastFetch.value < 300000); // 5 minutes

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  /**
   * Đăng nhập bằng Email/Password
   */
  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    setAuth(data.data.token, data.data.user);
    return data.data;
  }

  /**
   * Đăng ký tài khoản mới
   */
  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    setAuth(data.data.token, data.data.user);
    return data.data;
  }

  /**
   * Đăng nhập bằng Google OAuth
   * Redirect về backend → backend redirect về /auth/callback?token=...
   */
  function loginWithGoogle() {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  }

  /**
   * Xử lý callback từ Google OAuth
   */
  async function handleOAuthCallback(token) {
    setToken(token);
    await fetchCurrentUser();
  }

  /**
   * Lấy thông tin user hiện tại từ server (với cache check)
   */
  async function fetchCurrentUser(forceRefresh = false) {
    if (!token.value) return null;

    // Skip if fresh and not forced
    if (!forceRefresh && isUserFresh.value) {
      return user.value;
    }

    try {
      const { data } = await api.get("/auth/me");
      user.value = data.data;
      userLastFetch.value = Date.now();
      return data.data;
    } catch (error) {
      // If fetch fails, clear auth
      clearAuth();
      throw error;
    }
  }

  /**
   * Đăng xuất
   */
  async function logout() {
    clearAuth();
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  function setAuth(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    userLastFetch.value = Date.now();
    localStorage.setItem("hl_token", newToken);
  }

  function setToken(newToken) {
    token.value = newToken;
    localStorage.setItem("hl_token", newToken);
  }

  function clearAuth() {
    token.value = null;
    user.value = null;
    userLastFetch.value = 0;
    localStorage.removeItem("hl_token");
  }

  return {
    // state
    user,
    token,
    userLastFetch,
    // getters
    isLoggedIn,
    isAdmin,
    isUserFresh,
    // actions
    login,
    register,
    loginWithGoogle,
    handleOAuthCallback,
    fetchCurrentUser,
    logout,
    setAuth,
    setToken,
    clearAuth,
  };
});
