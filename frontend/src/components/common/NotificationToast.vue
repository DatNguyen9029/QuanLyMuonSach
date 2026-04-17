<template>
  <!--
    NotificationToast.vue - Happy Library
    ──────────────────────────────────────
    Hiển thị popup toast ở góc dưới-phải màn hình khi có notification mới.
    Tự động ẩn sau 5 giây (có thể đóng thủ công).

    CÁCH DÙNG (trong App.vue hoặc layout chính):
      <NotificationToast />

    Không cần truyền props — component tự đọc từ notification store.
  -->
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastQueue"
          :key="toast.id"
          class="toast"
          :class="[`toast--${toast.type}`, { 'toast--unread': !toast.read }]"
          role="alert"
        >
          <!-- Icon theo type -->
          <span class="toast__icon" :aria-label="iconLabel(toast.type)">
            {{ iconFor(toast.type) }}
          </span>

          <!-- Nội dung -->
          <div class="toast__body">
            <p class="toast__title">{{ toast.title }}</p>
            <p class="toast__message">{{ toast.message }}</p>
          </div>

          <!-- Nút đóng -->
          <button
            class="toast__close"
            aria-label="Đóng thông báo"
            @click="notifStore.removeToast(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import { useNotificationStore } from "@/stores/notification.store";

const notifStore = useNotificationStore();
const toastQueue = computed(() => notifStore.toastQueue);

/**
 * Map notification type → emoji icon.
 * Dùng emoji để đơn giản, có thể thay bằng SVG icon library nếu muốn.
 */
function iconFor(type) {
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️", // Vàng — sắp đến hạn
    error: "🚨", // Đỏ — quá hạn, mất sách
    borrow_update: "📚",
    chat_new: "💬",
  };
  return icons[type] || "🔔";
}

function iconLabel(type) {
  const labels = {
    info: "Thông tin",
    success: "Thành công",
    warning: "Cảnh báo",
    error: "Khẩn cấp",
    borrow_update: "Cập nhật mượn sách",
    chat_new: "Tin nhắn mới",
  };
  return labels[type] || "Thông báo";
}
</script>

<style scoped>
/* ── Container ─────────────────────────────────────────────────────────────── */
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse; /* Mới nhất ở dưới */
  gap: 0.75rem;
  max-width: 22rem;
  pointer-events: none; /* Click xuyên qua nếu không có toast */
}

/* ── Toast card ─────────────────────────────────────────────────────────────── */
.toast {
  pointer-events: all;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  border-left: 4px solid transparent;
  background: var(--color-background-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  cursor: default;
  transition: box-shadow 0.2s;
}
.toast:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
}

/* ── Type variants — border-left color + subtle background tint ───────────── */
.toast--info {
  border-left-color: var(--color-border-info);
  background-color: var(--color-background-info);
}
.toast--success {
  border-left-color: var(--color-border-success);
  background-color: var(--color-background-success);
}
.toast--warning {
  /* Vàng — nhắc nhở sắp đến hạn */
  border-left-color: #ef9f27;
  background-color: #faeeda;
}
.toast--error {
  /* Đỏ — quá hạn / mất sách / lỗi nghiêm trọng */
  border-left-color: #e24b4a;
  background-color: #fcebeb;
}
.toast--borrow_update {
  border-left-color: var(--color-border-info);
  background-color: var(--color-background-info);
}
.toast--chat_new {
  border-left-color: #7f77dd; /* purple */
  background-color: #eeedfe;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  .toast--warning {
    background-color: #412402;
    border-left-color: #ef9f27;
  }
  .toast--error {
    background-color: #501313;
    border-left-color: #e24b4a;
  }
  .toast--chat_new {
    background-color: #26215c;
    border-left-color: #afa9ec;
  }
}

/* ── Icon ───────────────────────────────────────────────────────────────────── */
.toast__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 1px;
}

/* ── Body ───────────────────────────────────────────────────────────────────── */
.toast__body {
  flex: 1;
  min-width: 0;
}
.toast__title {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toast__message {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  /* Cho phép hiển thị tối đa 2 dòng */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Warning / Error text color adjustments ─────────────────────────────────── */
.toast--warning .toast__title {
  color: #633806;
}
.toast--warning .toast__message {
  color: #854f0b;
}
.toast--error .toast__title {
  color: #791f1f;
}
.toast--error .toast__message {
  color: #a32d2d;
}

@media (prefers-color-scheme: dark) {
  .toast--warning .toast__title {
    color: #fac775;
  }
  .toast--warning .toast__message {
    color: #ef9f27;
  }
  .toast--error .toast__title {
    color: #f7c1c1;
  }
  .toast--error .toast__message {
    color: #f09595;
  }
}

/* ── Close button ───────────────────────────────────────────────────────────── */
.toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
  transition:
    color 0.15s,
    background 0.15s;
}
.toast__close:hover {
  color: var(--color-text-primary);
  background: var(--color-background-secondary);
}

/* ── Transition animation ───────────────────────────────────────────────────── */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
