<template>
  <div class="notifications-view p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 mb-1">Thông báo</h1>
        <p class="text-slate-600">Tất cả thông báo của bạn</p>
      </div>
      <button
        @click="markAllAsRead"
        :disabled="!notificationStore.unreadCount"
        class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-medium rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
      >
        Đánh dấu tất cả đã đọc ({{ notificationStore.unreadCount }})
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        class="stat-card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl"
      >
        <div class="flex items-center">
          <div
            class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4"
          >
            <svg
              class="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M15 17h3.5a1.5 1.5 0 001.5-1.5V12a1 1 0 00-1-1H9a1 1 0 00-.9.55L5.7 18.2a1 1 0 00-.1.3v0a1 1 0 00.1.4h.02a1 1 0 00.26.2l.07.02H11M9 10H4m0 0L6 8m-2 2l2 2"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">
              {{ notificationStore.notifications.length }}
            </p>
            <p class="text-slate-600">Tổng</p>
          </div>
        </div>
      </div>

      <div
        class="stat-card bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 p-6 rounded-2xl"
      >
        <div class="flex items-center">
          <div
            class="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mr-4"
          >
            <svg
              class="w-6 h-6 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">
              {{ notificationStore.unreadCount }}
            </p>
            <p class="text-slate-600">Chưa đọc</p>
          </div>
        </div>
      </div>

      <div
        class="stat-card bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 p-6 rounded-2xl"
      >
        <div class="flex items-center">
          <div
            class="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mr-4"
          >
            <svg
              class="w-6 h-6 text-slate-600"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ recentCount }}</p>
            <p class="text-slate-600">Hôm nay</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & List -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <!-- Filters -->
      <div
        class="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-200"
      >
        <button
          v-for="(filter, key) in filters"
          :key="key"
          @click="currentFilter = key"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
            currentFilter === key
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
          ]"
        >
          {{ filter.label }}
          <span
            v-if="filter.count > 0 && currentFilter !== key"
            class="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
            >{{ filter.count }}</span
          >
        </button>
      </div>

      <!-- List -->
      <div
        v-if="notificationStore.isLoading"
        class="text-center py-12 text-slate-500"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-300 mx-auto mb-4"
        ></div>
        Đang tải...
      </div>

      <div v-else-if="filteredNotifications.length">
        <div
          v-for="notification in filteredNotifications"
          :key="notification._id"
          class="notification-card group p-6 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all mb-4 last:mb-0 bg-white"
        >
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <div
                class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                :class="getTypeClass(notification.type)"
              >
                <svg
                  class="w-7 h-7"
                  :class="getIconColor(notification.type)"
                  fill="currentColor"
                >
                  <!-- Icons as in dropdown -->
                </svg>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-slate-900 text-lg leading-tight">
                  {{ notification.title }}
                </h3>
                <span
                  :class="[
                    'ml-3 px-3 py-1 rounded-full text-xs font-semibold',
                    notification.read
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-blue-100 text-blue-700',
                  ]"
                >
                  {{ notification.read ? "Đã đọc" : "Mới" }}
                </span>
              </div>
              <p class="text-slate-600 leading-relaxed mb-3">
                {{ notification.message }}
              </p>
              <div class="flex items-center gap-4 text-xs text-slate-500">
                <span>{{ formatTime(notification.createdAt) }}</span>
                <span v-if="notification.relatedType" class="capitalize">{{
                  notification.relatedType
                }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                @click.stop="markAsRead(notification._id)"
                class="p-2 text-slate-400 hover:text-slate-600"
                title="Đánh dấu đã đọc"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-20">
        <svg
          class="w-24 h-24 mx-auto mb-6 text-slate-400"
          fill="none"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15 17h3.5a1.5 1.5 0 001.5-1.5V12a1 1 0 00-1-1H9a1 1 0 00-.9.55L5.7 18.2a1 1 0 00-.1.3v0a1 1 0 00.1.4h.02a1 1 0 00.26.2l.07.02H11M9 10H4m0 0L6 8m-2 2l2 2"
          />
        </svg>
        <h3 class="text-2xl font-bold text-slate-900 mb-2">
          Không có thông báo
        </h3>
        <p class="text-slate-500 max-w-md mx-auto">
          Bạn chưa có thông báo mới nào. Tiếp tục sử dụng hệ thống để nhận cập
          nhật.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useNotificationStore } from "@/stores/notification.store";

const notificationStore = useNotificationStore();

const currentFilter = ref("all");

// Filters
const filters = computed(() => ({
  all: { label: "Tất cả", count: notificationStore.notifications.length },
  unread: {
    label: "Chưa đọc",
    count: notificationStore.unreadNotifications().length,
  },
  today: { label: "Hôm nay", count: todayNotifications.value.length },
  borrow_update: { label: "Mượn/Trả", count: borrowNotifications.value.length },
  chat_new: { label: "Tin nhắn", count: chatNotifications.value.length },
}));

const filteredNotifications = computed(() => {
  let result = notificationStore.notifications;

  if (currentFilter.value === "unread") {
    result = result.filter((n) => !n.read);
  } else if (currentFilter.value === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    result = result.filter((n) => new Date(n.createdAt) >= today);
  } else if (currentFilter.value === "borrow_update") {
    result = result.filter((n) => n.type === "borrow_update");
  } else if (currentFilter.value === "chat_new") {
    result = result.filter((n) => n.type === "chat_new");
  }

  return result;
});

const recentCount = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return notificationStore.notifications.filter(
    (n) => new Date(n.createdAt) >= today,
  ).length;
});

const todayNotifications = computed(() => recentCount.value);
const borrowNotifications = computed(
  () =>
    notificationStore.notifications.filter((n) => n.type === "borrow_update")
      .length,
);
const chatNotifications = computed(
  () =>
    notificationStore.notifications.filter((n) => n.type === "chat_new").length,
);

async function markAllAsRead() {
  await notificationStore.markAllAsRead();
}

async function markAsRead(id) {
  await notificationStore.markAsRead(id);
}

onMounted(() => {
  notificationStore.fetchNotifications();
});
</script>

<style scoped>
.stat-card {
  backdrop-filter: blur(10px);
}
</style>

export default { name: "Notifications" }
