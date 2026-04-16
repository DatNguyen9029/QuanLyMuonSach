// ─────────────────────────────────────────────────────────────────────────────
// src/main.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point cho ứng dụng Vue 3
// - Khởi tạo store (Pinia)
// - Cấu hình router với guards
// - Khởi tạo global plugins
// - Mount app vào DOM

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// ─── STYLES ──────────────────────────────────────────────────────────────────
// Import global styles (TailwindCSS + Custom)
import "./styles/fonts.css";
import "./styles/main.css";

// ─── INITIALIZE APP ──────────────────────────────────────────────────────────
const app = createApp(App);

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error("❌ Vue Error:", err, info);
  // Optional: Gửi error logs đến monitoring service (Sentry, etc.)
};

// Global warning handler (chỉ dev mode)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn("⚠️  Vue Warning:", msg, trace);
  };
}

// ─── REGISTER PLUGINS ────────────────────────────────────────────────────────
app.use(createPinia()); // State management
app.use(router); // Routing

// ─── Global Notification Toast Provider ─────────────────────────────────────
let toastQueue = [];
let activeToast = null;

function showToast(notification) {
  toastQueue.push(notification);
  if (!activeToast) showNextToast();
}

function showNextToast() {
  if (toastQueue.length === 0) return;

  activeToast = toastQueue.shift();
  const toastApp = createApp(NotificationToast, { notification: activeToast });
  toastApp.mount(document.createElement("div"));

  // Auto dismiss after timeout
  setTimeout(() => {
    toastApp.unmount();
    activeToast = null;
    showNextToast();
  }, 5000);
}

// Listen for new notifications globally
const notificationStore = useNotificationStore();
watch(
  () => notificationStore.notifications,
  (notifications) => {
    notifications.forEach((notification) => {
      if (!notification.read) {
        showToast(notification);
      }
    });
  },
  { deep: true },
);

// ─── MOUNT APP ──────────────────────────────────────────────────────────────
app.mount("#app");
