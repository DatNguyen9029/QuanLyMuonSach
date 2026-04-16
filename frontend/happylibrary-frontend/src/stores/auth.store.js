// src/stores/auth.store.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  const user = ref(null);
  const token = ref(localStorage.getItem("hl_token") || null);

  // ─── GETTERS ───────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  /**
   * Đăng nhập bằng Email/Password
   */
  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    setAuth(data.token, data.user);
    return data;
  }

  /**
   * Đăng ký tài khoản mới
   */
  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    setAuth(data.token, data.user);
    return data;
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
   * Lấy thông tin user hiện tại từ server
   */
  async function fetchCurrentUser() {
    const { data } = await api.get("/auth/me");
    user.value = data.user;
    return data.user;
  }

  /**
   * Đăng xuất
   */
  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      /* ignore */
    }
    clearAuth();
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  function setAuth(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem("hl_token", newToken);
  }

  function setToken(newToken) {
    token.value = newToken;
    localStorage.setItem("hl_token", newToken);
  }

  function clearAuth() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("hl_token");
  }

  return {
    // state
    user,
    token,
    // getters
    isLoggedIn,
    isAdmin,
    // actions
    login,
    register,
    loginWithGoogle,
    handleOAuthCallback,
    fetchCurrentUser,
    logout,
    clearAuth,
  };
});
