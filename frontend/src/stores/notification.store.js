import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useNotificationStore = defineStore("notification", () => {
  const MAX_TOAST_QUEUE = 5;

  const notifications = ref([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: null,
    totalPages: null,
    hasMore: false,
    nextCursor: null,
  });
  const toastQueue = ref([]);
  const toastTimers = new Map();

  const socketRef = ref(null);

  const hasUnread = computed(() => unreadCount.value > 0);
  const unreadList = computed(() => notifications.value.filter((n) => !n.read));

  function normalizeNotification(notif = {}) {
    return {
      _id: notif._id,
      title: notif.title || "Thông báo",
      message: notif.message || "",
      type: notif.type || "info",
      relatedId: notif.relatedId || null,
      relatedType: notif.relatedType || null,
      data: notif.data || {},
      read: Boolean(notif.read),
      createdAt: notif.createdAt || new Date().toISOString(),
    };
  }

  function resetPaginationFromResponse(rawPagination = {}) {
    const currentPage = Number(pagination.value.page || 1);
    pagination.value = {
      page: Number(rawPagination.page || currentPage),
      limit: Number(rawPagination.limit || pagination.value.limit || 10),
      total:
        rawPagination.total === null || rawPagination.total === undefined
          ? null
          : Number(rawPagination.total),
      totalPages:
        rawPagination.totalPages === null || rawPagination.totalPages === undefined
          ? null
          : Number(rawPagination.totalPages),
      hasMore: Boolean(rawPagination.hasMore),
      nextCursor: rawPagination.nextCursor || null,
    };
  }

  function upsertNotification(incoming) {
    const notif = normalizeNotification(incoming);
    const index = notifications.value.findIndex((n) => n._id === notif._id);

    if (index >= 0) {
      notifications.value[index] = { ...notifications.value[index], ...notif };
      return;
    }

    notifications.value.unshift(notif);
  }

  async function fetchNotifications({
    page = 1,
    read = null,
    cursor = null,
    append = null,
  } = {}) {
    isLoading.value = true;
    try {
      const params = { page, limit: pagination.value.limit };
      if (read !== null) params.read = read;
      if (cursor) params.cursor = cursor;

      const { data } = await api.get("/notifications", { params });
      const list = Array.isArray(data?.data)
        ? data.data.map(normalizeNotification)
        : [];
      const shouldAppend =
        append === null ? Boolean(cursor || Number(page) > 1) : Boolean(append);

      if (!shouldAppend) {
        notifications.value = list;
      } else {
        const seen = new Set(notifications.value.map((n) => n._id));
        notifications.value.push(...list.filter((n) => !seen.has(n._id)));
      }

      resetPaginationFromResponse(data?.pagination || {});
      unreadCount.value = Number(data?.stats?.unreadCount || 0);
    } catch (err) {
      console.error("[NotificationStore] Fetch notifications error:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get("/notifications/unread-count");
      unreadCount.value = Number(data?.data?.unreadCount || 0);
      return unreadCount.value;
    } catch (err) {
      console.error("[NotificationStore] Fetch unread count error:", err);
      throw err;
    }
  }

  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);

      const notif = notifications.value.find((n) => n._id === id);
      if (notif && !notif.read) {
        notif.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }

      if (socketRef.value?.connected) {
        socketRef.value.emit("notification:markRead", id);
      }
    } catch (err) {
      console.error("[NotificationStore] Mark as read error:", err);
      throw err;
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      notifications.value = notifications.value.map((n) => ({ ...n, read: true }));
      unreadCount.value = 0;
    } catch (err) {
      console.error("[NotificationStore] Mark all as read error:", err);
      throw err;
    }
  }

  function listenSocket(socket) {
    if (!socket) return;

    if (socketRef.value === socket) return;

    detachSocketListeners();
    socketRef.value = socket;

    socket.on("notification:new", (incoming) => {
      const beforeUnread = unreadCount.value;
      upsertNotification({ ...incoming, read: Boolean(incoming?.read) });

      const wasRead = Boolean(incoming?.read);
      if (!wasRead) {
        unreadCount.value = beforeUnread + 1;
      }

      pushToast(incoming);
    });

    socket.on("notification:markedRead", (notifId) => {
      const notif = notifications.value.find((n) => n._id === notifId);
      if (notif && !notif.read) {
        notif.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    });
  }

  function detachSocketListeners() {
    if (!socketRef.value) return;
    socketRef.value.off("notification:new");
    socketRef.value.off("notification:markedRead");
    socketRef.value = null;
  }

  function init(socket) {
    if (socket) {
      listenSocket(socket);
    }
    return Promise.allSettled([fetchNotifications(), fetchUnreadCount()]);
  }

  function pushToast(notif, duration = 5000) {
    const normalized = normalizeNotification(notif);
    const toastId =
      normalized._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    if (toastQueue.value.some((t) => t.id === toastId)) return;

    while (toastQueue.value.length >= MAX_TOAST_QUEUE) {
      const dropped = toastQueue.value.shift();
      if (dropped) {
        const timerId = toastTimers.get(dropped.id);
        if (timerId) clearTimeout(timerId);
        toastTimers.delete(dropped.id);
      }
    }

    toastQueue.value.push({ ...normalized, id: toastId });
    const timerId = setTimeout(() => removeToast(toastId), duration);
    toastTimers.set(toastId, timerId);
  }

  function removeToast(toastId) {
    toastQueue.value = toastQueue.value.filter((t) => t.id !== toastId);
    const timerId = toastTimers.get(toastId);
    if (timerId) clearTimeout(timerId);
    toastTimers.delete(toastId);
  }

  function reset() {
    notifications.value = [];
    unreadCount.value = 0;
    toastQueue.value = [];
    pagination.value = {
      page: 1,
      limit: 10,
      total: null,
      totalPages: null,
      hasMore: false,
      nextCursor: null,
    };
    for (const timerId of toastTimers.values()) {
      clearTimeout(timerId);
    }
    toastTimers.clear();
    detachSocketListeners();
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    pagination,
    toastQueue,
    hasUnread,
    unreadList,
    init,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    listenSocket,
    detachSocketListeners,
    pushToast,
    removeToast,
    reset,
  };
});
