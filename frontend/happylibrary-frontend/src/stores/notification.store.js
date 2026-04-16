// src/stores/notification.store.js
import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";
import { getSocket } from "@/services/socket";

export const useNotificationStore = defineStore("notification", () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  const notifications = ref([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);

  // ─── Getters ───────────────────────────────────────────────────────────────
  const unreadNotifications = () => notifications.value.filter((n) => !n.read);

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Fetch notifications from API
   */
  async function fetchNotifications({
    page = 1,
    limit = 10,
    read = null,
  } = {}) {
    isLoading.value = true;
    try {
      const params = { page, limit };
      if (read !== null) params.read = read;

      const { data } = await api.get("/notifications", { params });
      notifications.value = data.data;
      unreadCount.value = data.stats.unreadCount;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get unread count only
   */
  async function fetchUnreadCount() {
    const { data } = await api.get("/notifications/unread-count");
    unreadCount.value = data.data.unreadCount;
  }

  /**
   * Mark single notification as read
   */
  async function markAsRead(notificationId) {
    await api.patch(`/notifications/${notificationId}/read`);
    const index = notifications.value.findIndex(
      (n) => n._id === notificationId,
    );
    if (index > -1) {
      notifications.value[index].read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead() {
    await api.patch("/notifications/read-all");
    notifications.value.forEach((n) => (n.read = true));
    unreadCount.value = 0;
  }

  /**
   * Socket listeners setup
   */
  function setupSocketListeners(userId) {
    const socket = getSocket();

    socket.on("newNotification", (notification) => {
      notifications.value.unshift(notification);
      if (!notification.read) unreadCount.value++;
    });

    socket.on("notificationRead", ({ id }) => {
      const index = notifications.value.findIndex((n) => n._id === id);
      if (index > -1) {
        notifications.value[index].read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    });

    socket.on("allNotificationsRead", ({ modifiedCount }) => {
      notifications.value.forEach((n) => (n.read = true));
      unreadCount.value = 0;
    });

    // Admin notifications
    socket.on("adminNotification", (notification) => {
      notifications.value.unshift(notification);
      if (!notification.read) unreadCount.value++;
    });

    // Join user room
    socket.emit("joinUserRoom", userId);
  }

  /**
   * Clear socket listeners
   */
  function clearSocketListeners() {
    const socket = getSocket();
    socket.off("newNotification");
    socket.off("notificationRead");
    socket.off("allNotificationsRead");
    socket.off("adminNotification");
  }

  return {
    // state
    notifications,
    unreadCount,
    isLoading,
    // getters
    unreadNotifications,
    // actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    setupSocketListeners,
    clearSocketListeners,
  };
});
