<template>
  <!--
    NotificationDropdown.vue - Happy Library
    ──────────────────────────────────────────
    Dropdown hiển thị danh sách thông báo với:
      - Badge đếm số chưa đọc
      - Màu sắc theo type (warning=vàng, error=đỏ, success=xanh...)
      - Nút "Đánh dấu tất cả đã đọc"
      - Phân trang (load more)
      - Skeleton loading

    CÁCH DÙNG (trong Navbar):
      <NotificationDropdown />
  -->
  <div class="notif-wrapper" v-click-outside="closeDropdown">
    <!-- ── Bell button với badge ───────────────────────────────────────────── -->
    <button
      class="notif-bell"
      :aria-label="`Thông báo${notifStore.hasUnread ? ` (${notifStore.unreadCount} chưa đọc)` : ''}`"
      @click="toggleDropdown"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      <!-- Badge số chưa đọc -->
      <Transition name="badge">
        <span
          v-if="notifStore.hasUnread"
          class="notif-badge"
          aria-hidden="true"
        >
          {{ notifStore.unreadCount > 99 ? "99+" : notifStore.unreadCount }}
        </span>
      </Transition>
    </button>

    <!-- ── Dropdown panel ─────────────────────────────────────────────────── -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="notif-panel"
        role="dialog"
        aria-label="Danh sách thông báo"
      >
        <!-- Header -->
        <div class="notif-panel__header">
          <h3 class="notif-panel__title">Thông báo</h3>
          <button
            v-if="notifStore.hasUnread"
            class="notif-panel__read-all"
            @click="notifStore.markAllAsRead()"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        <!-- Filter tabs -->
        <div class="notif-panel__tabs" role="tablist">
          <button
            role="tab"
            :aria-selected="activeTab === 'all'"
            class="notif-tab"
            :class="{ 'notif-tab--active': activeTab === 'all' }"
            @click="switchTab('all')"
          >
            Tất cả
          </button>
          <button
            role="tab"
            :aria-selected="activeTab === 'unread'"
            class="notif-tab"
            :class="{ 'notif-tab--active': activeTab === 'unread' }"
            @click="switchTab('unread')"
          >
            Chưa đọc
            <span v-if="notifStore.unreadCount > 0" class="notif-tab__count">
              {{ notifStore.unreadCount }}
            </span>
          </button>
        </div>

        <!-- List -->
        <div class="notif-panel__list" @scroll="onScroll">
          <!-- Skeleton loading -->
          <template
            v-if="notifStore.isLoading && notifStore.notifications.length === 0"
          >
            <div v-for="i in 4" :key="i" class="notif-skeleton">
              <div class="notif-skeleton__icon"></div>
              <div class="notif-skeleton__body">
                <div class="notif-skeleton__title"></div>
                <div class="notif-skeleton__message"></div>
              </div>
            </div>
          </template>

          <!-- Empty state -->
          <div
            v-else-if="displayedNotifications.length === 0"
            class="notif-empty"
          >
            <span class="notif-empty__icon">🔔</span>
            <p>
              {{
                activeTab === "unread"
                  ? "Không có thông báo chưa đọc"
                  : "Chưa có thông báo nào"
              }}
            </p>
          </div>

          <!-- Notification items -->
          <template v-else>
            <button
              v-for="notif in displayedNotifications"
              :key="notif._id"
              class="notif-item"
              :class="[
                `notif-item--${notif.type}`,
                { 'notif-item--unread': !notif.read },
              ]"
              @click="handleItemClick(notif)"
            >
              <!-- Type indicator dot + icon -->
              <span
                class="notif-item__icon"
                :aria-label="iconLabel(notif.type)"
              >
                {{ iconFor(notif.type) }}
              </span>

              <!-- Content -->
              <div class="notif-item__content">
                <p class="notif-item__title">{{ notif.title }}</p>
                <p class="notif-item__message">{{ notif.message }}</p>
                <time class="notif-item__time" :datetime="notif.createdAt">
                  {{ timeAgo(notif.createdAt) }}
                </time>
              </div>

              <!-- Unread dot -->
              <span
                v-if="!notif.read"
                class="notif-item__dot"
                aria-hidden="true"
              ></span>
            </button>

            <!-- Load more -->
            <button
              v-if="hasMore"
              class="notif-load-more"
              :disabled="notifStore.isLoading"
              @click="loadMore"
            >
              {{ notifStore.isLoading ? "Đang tải..." : "Xem thêm" }}
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useNotificationStore } from "@/stores/notification.store";
import { useRouter } from "vue-router";

const notifStore = useNotificationStore();
const router = useRouter();

const isOpen = ref(false);
const activeTab = ref("all"); // 'all' | 'unread'

// ── Computed ────────────────────────────────────────────────────────────────
const displayedNotifications = computed(() => {
  if (activeTab.value === "unread") return notifStore.unreadList;
  return notifStore.notifications;
});

const hasMore = computed(() => {
  const { page, totalPages } = notifStore.pagination;
  return page < totalPages;
});

// ── Methods ─────────────────────────────────────────────────────────────────
function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    notifStore.fetchNotifications(); // Refresh khi mở
  }
}

function closeDropdown() {
  isOpen.value = false;
}

function switchTab(tab) {
  activeTab.value = tab;
  if (tab === "all") {
    notifStore.fetchNotifications({ page: 1 });
  }
}

async function handleItemClick(notif) {
  // Đánh dấu đọc
  if (!notif.read) {
    await notifStore.markAsRead(notif._id);
  }

  // Navigate đến trang liên quan
  if (notif.relatedType === "borrow" && notif.relatedId) {
    router.push(`/borrows/${notif.relatedId}`);
    closeDropdown();
  } else if (notif.relatedType === "chat" && notif.relatedId) {
    router.push(`/chat/${notif.relatedId}`);
    closeDropdown();
  }
}

async function loadMore() {
  const nextPage = notifStore.pagination.page + 1;
  await notifStore.fetchNotifications({ page: nextPage });
}

// ── Icon helpers (đồng bộ với NotificationToast) ────────────────────────────
function iconFor(type) {
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "🚨",
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

/**
 * Format thời gian tương đối (e.g. "2 phút trước", "1 giờ trước")
 */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}
</script>

<style scoped>
/* ── Wrapper + Bell ─────────────────────────────────────────────────────────── */
.notif-wrapper {
  position: relative;
}
.notif-bell {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.5rem;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  transition:
    color 0.15s,
    background 0.15s;
}
.notif-bell:hover {
  color: var(--color-text-primary);
  background: var(--color-background-secondary);
}

/* ── Badge ──────────────────────────────────────────────────────────────────── */
.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: #e24b4a;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.badge-enter-active,
.badge-leave-active {
  transition: all 0.2s;
}
.badge-enter-from,
.badge-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* ── Dropdown panel ─────────────────────────────────────────────────────────── */
.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 22rem;
  max-height: 32rem;
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}
.dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.dropdown-leave-active {
  transition: all 0.15s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.notif-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem;
  flex-shrink: 0;
}
.notif-panel__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
}
.notif-panel__read-all {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--color-text-info);
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.notif-panel__read-all:hover {
  background: var(--color-background-info);
}

/* ── Tabs ───────────────────────────────────────────────────────────────────── */
.notif-panel__tabs {
  display: flex;
  padding: 0 1rem;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border-tertiary);
  flex-shrink: 0;
}
.notif-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition:
    color 0.15s,
    border-color 0.15s;
  margin-bottom: -1px;
}
.notif-tab--active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-text-primary);
}
.notif-tab__count {
  background: #e24b4a;
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
  font-weight: 500;
}

/* ── List ───────────────────────────────────────────────────────────────────── */
.notif-panel__list {
  overflow-y: auto;
  flex: 1;
}

/* ── Item ───────────────────────────────────────────────────────────────────── */
.notif-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-tertiary);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  position: relative;
}
.notif-item:last-child {
  border-bottom: none;
}
.notif-item:hover {
  background: var(--color-background-secondary);
}

/* Unread: nền nhạt theo type */
.notif-item--unread {
  background: var(--color-background-secondary);
}

/* Màu nền theo type khi chưa đọc */
.notif-item--warning.notif-item--unread {
  background: rgba(250, 238, 218, 0.5);
}
.notif-item--error.notif-item--unread {
  background: rgba(252, 235, 235, 0.5);
}
.notif-item--success.notif-item--unread {
  background: rgba(234, 243, 222, 0.5);
}

@media (prefers-color-scheme: dark) {
  .notif-item--warning.notif-item--unread {
    background: rgba(65, 36, 2, 0.4);
  }
  .notif-item--error.notif-item--unread {
    background: rgba(80, 19, 19, 0.4);
  }
  .notif-item--success.notif-item--unread {
    background: rgba(23, 52, 4, 0.4);
  }
}

.notif-item__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 1px;
}
.notif-item__content {
  flex: 1;
  min-width: 0;
}
.notif-item__title {
  margin: 0 0 0.2rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Title màu theo type khi chưa đọc */
.notif-item--warning .notif-item__title {
  color: #633806;
}
.notif-item--error .notif-item__title {
  color: #791f1f;
}

@media (prefers-color-scheme: dark) {
  .notif-item--warning .notif-item__title {
    color: #fac775;
  }
  .notif-item--error .notif-item__title {
    color: #f7c1c1;
  }
}

.notif-item__message {
  margin: 0 0 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notif-item__time {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

/* Unread dot */
.notif-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #185fa5;
  flex-shrink: 0;
  margin-top: 6px;
}
.notif-item--warning .notif-item__dot {
  background: #ef9f27;
}
.notif-item--error .notif-item__dot {
  background: #e24b4a;
}

/* ── Skeleton ────────────────────────────────────────────────────────────────── */
.notif-skeleton {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border-tertiary);
}
.notif-skeleton__icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-background-secondary);
  flex-shrink: 0;
  animation: pulse 1.4s ease-in-out infinite;
}
.notif-skeleton__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.notif-skeleton__title {
  height: 14px;
  border-radius: 4px;
  background: var(--color-background-secondary);
  animation: pulse 1.4s ease-in-out infinite;
  width: 60%;
}
.notif-skeleton__message {
  height: 12px;
  border-radius: 4px;
  background: var(--color-background-secondary);
  animation: pulse 1.4s ease-in-out infinite 0.2s;
  width: 90%;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
  gap: 0.5rem;
}
.notif-empty__icon {
  font-size: 2rem;
}

/* ── Load more ───────────────────────────────────────────────────────────────── */
.notif-load-more {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  border-top: 1px solid var(--color-border-tertiary);
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--color-text-info);
  transition: background 0.15s;
}
.notif-load-more:hover:not(:disabled) {
  background: var(--color-background-secondary);
}
.notif-load-more:disabled {
  color: var(--color-text-tertiary);
  cursor: default;
}
</style>
