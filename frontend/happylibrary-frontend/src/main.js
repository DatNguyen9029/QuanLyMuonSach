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

// ─── Global Notification Toast Container ─────────────────────────────────────
const toastContainer = document.createElement("div");
toastContainer.id = "toast-container";
document.body.appendChild(toastContainer);

let toastQueue = [];
let activeToastIndex = -1;

function showToast(notification) {
  toastQueue.push(notification);
  if (activeToastIndex === -1) renderNextToast();
}

function renderNextToast() {
  if (toastQueue.length === 0) return;

  const notification = toastQueue.shift();
  const toastEl = document.createElement("div");
  toastContainer.appendChild(toastEl);

  const toastApp = createApp(NotificationToast, { notification });
  toastApp.mount(toastEl);

  // Auto dismiss
  setTimeout(() => {
    toastApp.unmount();
    toastEl.remove();
    activeToastIndex = -1;
    renderNextToast();
  }, 5000);
}

// ─── MOUNT APP ──────────────────────────────────────────────────────────────
app.mount("#app");

// ─── MOUNT APP ──────────────────────────────────────────────────────────────
app.mount("#app");
