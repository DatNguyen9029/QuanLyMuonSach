import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

// ─── LAZY-LOADED VIEWS ─────────────────────────────────────────
const LoginView = () => import("@/views/auth/LoginView.vue");
const RegisterView = () => import("@/views/auth/RegisterView.vue");
const DashboardView = () => import("@/views/DashboardView.vue");
const BookManagementView = () => import("@/views/BookManagementView.vue");
const BorrowManagementView = () => import("@/views/BorrowManagementView.vue");
const ReaderManagementView = () => import("@/views/ReaderManagementView.vue");
const PublisherManagementView = () =>
  import("@/views/PublisherManagementView.vue");
const ChatView = () => import("@/views/ChatView.vue");
const NotificationsView = () => import("@/views/NotificationsView.vue");

// ─── LAYOUTS ───────────────────────────────────────────────────
const AuthLayout = () => import("@/layouts/AuthLayout.vue");
const MainLayout = () => import("@/layouts/MainLayout.vue");

// ─── ROUTES ────────────────────────────────────────────────────
const routes = [
  // ── AUTH ─────────────────────────────────────────
  {
    path: "/auth",
    component: AuthLayout,
    redirect: "/auth/login",
    meta: { requiresGuest: true },
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

  // ── ROOT + MAIN ──────────────────────────────────
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
        meta: { title: "Tổng quan | Happy Library", keepAlive: true },
      },
      {
        path: "books",
        name: "Books",
        component: BookManagementView,
        meta: { title: "Quản lý Sách | Happy Library", keepAlive: false },
      },
      {
        path: "borrows",
        name: "Borrows",
        component: BorrowManagementView,
        meta: {
          title: "Quản lý Mượn/Trả | Happy Library",
          requiresAdmin: true,
          keepAlive: false,
        },
      },
      {
        path: "chat",
        name: "Chat",
        component: ChatView,
        meta: { title: "Tin nhắn | Happy Library", keepAlive: true },
      },
      {
        path: "notifications",
        name: "Notifications",
        component: NotificationsView,
        meta: { title: "Thông báo | Happy Library", keepAlive: false },
      },
      {
        path: "readers",
        name: "Readers",
        component: ReaderManagementView,
        meta: {
          title: "Quản lý Độc giả | Happy Library",
          requiresAdmin: true,
          keepAlive: false,
        },
      },
      {
        path: "publishers",
        name: "Publishers",
        component: PublisherManagementView,
        meta: {
          title: "Quản lý NXB | Happy Library",
          requiresAdmin: true,
          keepAlive: false,
        },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/ProfileView.vue"),
        meta: { title: "Hồ sơ cá nhân | Happy Library", keepAlive: false },
      },
    ],
  },

  // ── OAUTH ────────────────────────────────────────
  {
    path: "/auth/callback",
    name: "OAuthCallback",
    component: () => import("@/views/auth/OAuthCallbackView.vue"),
    meta: { title: "Đang xác thực..." },
  },

  // ── ERROR ────────────────────────────────────────
  {
    path: "/403",
    name: "Forbidden",
    component: () => import("@/views/error/ForbiddenView.vue"),
    meta: { title: "403 - Không có quyền truy cập" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/NotFoundView.vue"),
    meta: { title: "404 - Trang không tồn tại" },
  },
];

// ─── ROUTER ────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0, behavior: "smooth" };
  },
});

// ─── GLOBAL GUARD ──────────────────────────────────
router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title || "Happy Library";

  const authStore = useAuthStore();

  // Refresh user nếu cần
  if (authStore.token && (!authStore.user || !authStore.isUserFresh)) {
    await authStore.fetchCurrentUser(true).catch(() => {
      authStore.clearAuth();
    });
  }

  const isLoggedIn = authStore.isLoggedIn;
  const isAdmin = authStore.isAdmin;

  // ✅ FIX: xử lý root "/"
  if (to.path === "/") {
    return next(isLoggedIn ? "/dashboard" : "/auth/login");
  }

  // Auth guard
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({
      name: "Login",
      query: { redirect: to.fullPath },
    });
  }

  // Guest guard
  if (to.meta.requiresGuest && isLoggedIn) {
    return next({ name: "Dashboard" });
  }

  // Admin guard
  if (to.meta.requiresAdmin && !isAdmin) {
    return next({ name: "Forbidden" });
  }

  next();
});

export default router;
