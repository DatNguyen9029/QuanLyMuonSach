import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Layouts
import MainLayout from "@/layouts/MainLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

const routes = [
  {
    path: "/",
    component: AuthLayout,
    children: [
      { path: "", redirect: "/login" },
      {
        path: "login",
        name: "Login",
        component: () => import("@/views/auth/LoginView.vue"),
      },
      {
        path: "auth/callback",
        name: "AuthCallback",
        component: () => import("@/views/auth/CallbackView.vue"),
      },
    ],
  },
  {
    path: "/app",
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/app/dashboard" },
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/DashboardView.vue"),
      },
      {
        path: "books",
        name: "Books",
        component: () => import("@/views/BookManagement.vue"),
      },
      {
        path: "borrows",
        name: "Borrows",
        component: () => import("@/views/BorrowManagement.vue"),
      },
      {
        path: "readers",
        name: "Readers",
        component: () => import("@/views/ReaderManagement.vue"),
        meta: { requiresAdmin: true }, // Chỉ admin mới vào được
      },
      {
        path: "chat",
        name: "Chat",
        component: () => import("@/views/ChatView.vue"),
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ─── Navigation Guard ─────────────────────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Trang yêu cầu đăng nhập nhưng chưa có token → về login
  if (to.meta.requiresAuth && !authStore.token) {
    return next({ name: "Login", query: { redirect: to.fullPath } });
  }

  // Trang chỉ dành cho admin nhưng user thường cố vào → về dashboard
  if (to.meta.requiresAdmin && authStore.user?.role !== "admin") {
    return next({ name: "Dashboard" });
  }

  // Đã đăng nhập mà vào trang login → về dashboard
  if (to.name === "Login" && authStore.token) {
    return next({ name: "Dashboard" });
  }

  next();
});

export default router;
