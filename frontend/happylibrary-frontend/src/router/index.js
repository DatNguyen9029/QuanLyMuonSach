// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

// ─── LAZY-LOADED VIEWS ───────────────────────────────────────────────────────
const LoginView = () => import("@/views/auth/LoginView.vue");
const RegisterView = () => import("@/views/auth/RegisterView.vue");
const DashboardView = () => import("@/views/DashboardView.vue");
const BookManagementView = () => import("@/views/BookManagementView.vue");
const BorrowManagementView = () => import("@/views/BorrowManagementView.vue");
const ReaderManagementView = () => import("@/views/ReaderManagementView.vue");
const ChatView = () => import("@/views/ChatView.vue");

// ─── LAYOUTS ─────────────────────────────────────────────────────────────────
const AuthLayout = () => import("@/layouts/AuthLayout.vue");
const MainLayout = () => import("@/layouts/MainLayout.vue");

// ─── ROUTES ──────────────────────────────────────────────────────────────────
const routes = [
  // ── AUTH ROUTES (không cần đăng nhập) ──────────────────────────────────
  {
    path: "/auth",
    component: AuthLayout,
    redirect: "/auth/login",
    meta: { requiresGuest: true }, // Đã đăng nhập → redirect về dashboard
    children: [
      {
        path: "login",
        name: "Login",
        component: LoginView,
        meta: { title: "Đăng nhập | Happy Library" },
      },
      {
        path: "register",
        name: "Register",
        component: RegisterView,
        meta: { title: "Đăng ký | Happy Library" },
      },
    ],
  },
  {
    path: "/",
    redirect: "/auth/login",
  },

  // ── MAIN ROUTES (cần đăng nhập) ────────────────────────────────────────
  {
    path: "/",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: "/dashboard",
      },
      {
        path: "dashboard",
        name: "Dashboard",
        component: DashboardView,
        meta: {
          title: "Tổng quan | Happy Library",
          requiresAuth: true,
        },
      },
      {
        path: "books",
        name: "Books",
        component: BookManagementView,
        meta: {
          title: "Quản lý Sách | Happy Library",
          requiresAuth: true,
        },
      },
      {
        path: "borrows",
        name: "Borrows",
        component: BorrowManagementView,
        meta: {
          title: "Quản lý Mượn/Trả | Happy Library",
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: "chat",
        name: "Chat",
        component: ChatView,
        meta: {
          title: "Tin nhắn | Happy Library",
          requiresAuth: true,
        },
      },

      // ── ADMIN ONLY ROUTES ──────────────────────────────────────────────
      {
        path: "readers",
        name: "Readers",
        component: ReaderManagementView,
        meta: {
          title: "Quản lý Độc giả | Happy Library",
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/ProfileView.vue"),
        meta: {
          title: "Hồ sơ cá nhân | Happy Library",
          requiresAuth: true,
        },
      },
    ],
  },

  // ── OAUTH CALLBACK ──────────────────────────────────────────────────────
  {
    path: "/auth/callback",
    name: "OAuthCallback",
    component: () => import("@/views/auth/OAuthCallbackView.vue"),
    meta: { title: "Đang xác thực..." },
  },

  // ── 403 FORBIDDEN ──────────────────────────────────────────────────────
  {
    path: "/403",
    name: "Forbidden",
    component: () => import("@/views/error/ForbiddenView.vue"),
    meta: { title: "403 - Không có quyền truy cập" },
  },

  // ── 404 NOT FOUND ───────────────────────────────────────────────────────
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/NotFoundView.vue"),
    meta: { title: "404 - Trang không tồn tại" },
  },
];

// ─── CREATE ROUTER ────────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0, behavior: "smooth" };
  },
});

// ─── NAVIGATION GUARDS ────────────────────────────────────────────────────────
/**
 * Luồng phân quyền:
 *
 *  1. requiresAuth + chưa đăng nhập   → redirect /login
 *  2. requiresGuest + đã đăng nhập    → redirect /dashboard
 *  3. requiresAdmin + không phải Admin → redirect /403
 *  4. Mọi trường hợp còn lại          → tiếp tục bình thường
 */
router.beforeEach(async (to, from, next) => {
  // Cập nhật title tab trình duyệt
  document.title = to.meta.title || "Happy Library";

  const authStore = useAuthStore();

  // Nếu có token nhưng user data cũ → refresh nếu cần
  if (authStore.token && !authStore.isUserFresh) {
    await authStore.fetchCurrentUser(true).catch(() => {
      authStore.clearAuth();
    });
  }

  const isLoggedIn = authStore.isLoggedIn;
  const isAdmin = authStore.isAdmin;

  // ── GUARD 1: Trang yêu cầu đăng nhập ──────────────────────────────────
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({
      name: "Login",
      query: { redirect: to.fullPath }, // Lưu lại URL để redirect sau login
    });
  }

  // ── GUARD 2: Trang dành cho khách (chưa đăng nhập) ────────────────────
  if (to.meta.requiresGuest && isLoggedIn) {
    return next({ name: "Dashboard" });
  }

  // ── GUARD 3: Trang chỉ dành cho Admin ─────────────────────────────────
  if (to.meta.requiresAdmin && !isAdmin) {
    return next({ name: "Forbidden" });
  }

  // ── Default: cho phép đi tiếp ─────────────────────────────────────────
  next();
});

export default router;
