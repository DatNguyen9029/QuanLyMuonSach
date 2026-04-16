<template>
  <div class="notification-dropdown">
    <!-- Header -->
    <div class="dropdown-header px-6 py-4 border-b border-slate-100">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900">Thông báo</h3>
        <div class="text-sm text-slate-500 font-medium">
          {{ unreadCount }} chưa đọc
        </div>
      </div>
      <button
        @click="markAllAsRead"
        class="mt-2 text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-medium transition-all"
      >
        Đánh dấu tất cả đã đọc
      </button>
    </div>

    <!-- List -->
    <div class="notification-list max-h-96 overflow-y-auto">
      <div
        v-for="notification in displayedNotifications"
        :key="notification._id"
        class="notification-item px-6 py-4 border-b border-slate-50 hover:bg-slate-50 last:border-b-0 cursor-pointer transition-all"
        @click="toggleRead(notification)"
      >
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div class="flex-shrink-0 mt-1">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              :class="getIconClass(notification.type)"
            >
              <svg
                v-if="notification.type === 'success'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="notification.type === 'error'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="notification.type === 'warning'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="notification.type === 'chat_new'"
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-6v2h6V9zM9 5h2v2H9V5z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between mb-1">
              <h4
                class="font-semibold text-slate-900 text-sm leading-tight truncate"
              >
                {{ notification.title }}
              </h4>
              <span class="text-xs text-slate-400 ml-2 whitespace-nowrap">{{
                formatTime(notification.createdAt)
              }}</span>
            </div>
            <p class="text-slate-600 text-sm leading-relaxed line-clamp-2">
              {{ notification.message }}
            </p>
          </div>

          <!-- Unread dot -->
          <div
            v-if="!notification.read"
            class="flex-shrink-0 w-2 h-2 mt-2 ml-1"
          >
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="displayedNotifications.length === 0"
        class="px-6 py-8 text-center text-slate-500"
      >
        <svg
          class="w-12 h-12 mx-auto mb-2 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.5h3m1.5-3h3m-4.5 0H10m1.5-3V7a2 2 0 00-2-2h-1a2 2 0 00-2 2v6.5"
          />
        </svg>
        <p class="text-sm">Không có thông báo nào</p>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="dropdown-footer px-6 py-3 border-t border-slate-100 bg-slate-50"
    >
      <router-link
        to="/notifications"
        class="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 py-2 px-4 rounded-lg hover:bg-white transition-all"
      >
        Xem tất cả
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useNotificationStore } from "@/stores/notification.store";
import { useRouter } from "vue-router";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const notificationStore = useNotificationStore();
const router = useRouter();

const displayedNotifications = computed(() =>
  notificationStore.notifications.slice(0, 5),
);

const unreadCount = computed(() => notificationStore.unreadCount);

onMounted(() => {
  notificationStore.fetchUnreadCount();
  notificationStore.fetchNotifications({ limit: 5 });
});

function toggleRead(notification) {
  if (!notification.read) {
    notificationStore.markAsRead(notification._id);
  }
}

async function markAllAsRead() {
  await notificationStore.markAllAsRead();
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "Vừa xong";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}phút`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}giờ`;

  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIconClass(type) {
  const base = "shadow-sm";
  const colors = {
    success: "bg-green-100 border-green-200",
    error: "bg-red-100 border-red-200",
    warning: "bg-orange-100 border-orange-200",
    info: "bg-blue-100 border-blue-200",
    borrow_update: "bg-indigo-100 border-indigo-200",
    chat_new: "bg-purple-100 border-purple-200",
  };
  return `${base} ${colors[type] || colors.info}`;
}

// Close on outside click
onMounted(() => {
  const handleClickOutside = (event) => {
    if (
      !event.target.closest(".header-icon-btn") &&
      !event.target.closest(".notification-dropdown")
    ) {
      emit("update:modelValue", false);
    }
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-width: min(90vw, 380px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: dropdownSlide 0.2s ease-out;
  z-index: 1000;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.notification-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
}

.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: transparent;
}

.notification-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

.notification-item:hover {
  background: rgba(248, 250, 252, 1);
}
</style>
