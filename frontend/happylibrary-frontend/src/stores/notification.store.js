/**
 * Notification Store - Happy Library (Pinia)
 * ─────────────────────────────────────────────
 * Quản lý toàn bộ trạng thái notification phía frontend:
 *   - Fetch danh sách từ REST API
 *   - Lắng nghe sự kiện real-time từ Socket.io
 *   - Đánh dấu đọc (đơn lẻ và tất cả)
 *
 * CÁCH DÙNG:
 *   import { useNotificationStore } from '@/stores/notification.store';
 *   const notifStore = useNotificationStore();
 *   notifStore.init(socket); // Gọi 1 lần sau khi socket kết nối
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

// Tạo axios instance với base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm token vào mỗi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useNotificationStore = defineStore("notification", () => {
  // ── State ────────────────────────────────────────────────────────────────
  const notifications = ref([]); // Danh sách thông báo
  const unreadCount = ref(0); // Badge counter
  const isLoading = ref(false);
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Toast queue: các notification popup ngắn hạn (xuất hiện rồi tự ẩn)
  const toastQueue = ref([]); // [{ id, title, message, type, createdAt }]

  // ── Getters ──────────────────────────────────────────────────────────────
  const hasUnread = computed(() => unreadCount.value > 0);
  const unreadList = computed(() => notifications.value.filter((n) => !n.read));

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Khởi tạo store: fetch dữ liệu ban đầu + lắng nghe socket.
   * Gọi sau khi socket đã kết nối thành công.
   * @param {import('socket.io-client').Socket} socket
   */
  function init(socket) {
    fetchNotifications();
    fetchUnreadCount();
    listenSocket(socket);
  }

  /**
   * Fetch danh sách thông báo (phân trang).
   * @param {{ page?: number, read?: boolean|null }} options
   */
  async function fetchNotifications({ page = 1, read = null } = {}) {
    isLoading.value = true;
    try {
      const params = { page, limit: pagination.value.limit };
      if (read !== null) params.read = read;

      const { data } = await api.get("/notifications", { params });

      if (page === 1) {
        notifications.value = data.data; // Reset khi load trang đầu
      } else {
        notifications.value.push(...data.data); // Append khi load more
      }

      pagination.value = data.pagination;
      unreadCount.value = data.stats.unreadCount;
    } catch (err) {
      console.error("[NotificationStore] Lỗi khi fetch:", err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Chỉ fetch unread count (dùng cho badge, không cần load danh sách đầy đủ).
   */
  async function fetchUnreadCount() {
    try {
      const { data } = await api.get("/notifications/unread-count");
      unreadCount.value = data.data.unreadCount;
    } catch (err) {
      console.error("[NotificationStore] Lỗi khi fetch unread count:", err);
    }
  }

  /**
   * Đánh dấu đọc 1 thông báo.
   * @param {string} id - Notification ID
   */
  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);

      // Cập nhật local state ngay (optimistic update)
      const notif = notifications.value.find((n) => n._id === id);
      if (notif && !notif.read) {
        notif.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (err) {
      console.error("[NotificationStore] Lỗi khi mark as read:", err);
    }
  }

  /**
   * Đánh dấu đọc tất cả thông báo.
   */
  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");

      // Cập nhật local state
      notifications.value.forEach((n) => (n.read = true));
      unreadCount.value = 0;
    } catch (err) {
      console.error("[NotificationStore] Lỗi khi mark all as read:", err);
    }
  }

  /**
   * Lắng nghe sự kiện 'notification:new' từ Socket.io.
   * Khi có thông báo mới:
   *   1. Chèn vào đầu danh sách (newest first)
   *   2. Tăng unreadCount
   *   3. Đẩy vào toastQueue để hiển thị popup
   * @param {import('socket.io-client').Socket} socket
   */
  function listenSocket(socket) {
    if (!socket) return;

    socket.on("notification:new", (notif) => {
      // Tránh duplicate nếu server emit 2 lần
      const exists = notifications.value.some((n) => n._id === notif._id);
      if (!exists) {
        notifications.value.unshift({ ...notif, read: false });
        unreadCount.value += 1;
      }

      // Luôn hiển thị toast (kể cả nếu đã có trong list)
      pushToast(notif);
    });

    // Sync trạng thái đã đọc giữa nhiều tab của cùng 1 user
    socket.on("notification:markedRead", (notifId) => {
      const notif = notifications.value.find((n) => n._id === notifId);
      if (notif && !notif.read) {
        notif.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    });
  }

  /**
   * Thêm notification vào toast queue, tự động xóa sau timeout.
   * @param {Object} notif
   * @param {number} [duration=5000] ms trước khi toast tự ẩn
   */
  function pushToast(notif, duration = 5000) {
    const toastId = notif._id || Date.now().toString();

    // Tránh duplicate toast
    if (toastQueue.value.some((t) => t.id === toastId)) return;

    toastQueue.value.push({ ...notif, id: toastId });

    setTimeout(() => {
      removeToast(toastId);
    }, duration);
  }

  /**
   * Xóa toast khỏi queue (gọi khi user đóng toast thủ công).
   * @param {string} toastId
   */
  function removeToast(toastId) {
    toastQueue.value = toastQueue.value.filter((t) => t.id !== toastId);
  }

  /**
   * Reset store (dùng khi user logout).
   */
  function reset() {
    notifications.value = [];
    unreadCount.value = 0;
    toastQueue.value = [];
    pagination.value = { page: 1, limit: 10, total: 0, totalPages: 1 };
  }

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    pagination,
    toastQueue,
    // Getters
    hasUnread,
    unreadList,
    // Actions
    init,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    listenSocket,
    pushToast,
    removeToast,
    reset,
  };
});
