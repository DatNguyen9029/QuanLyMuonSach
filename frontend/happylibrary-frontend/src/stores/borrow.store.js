// src/stores/borrow.store.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useBorrowStore = defineStore("borrow", () => {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  const borrows = ref([]);
  const isLoading = ref(false);
  const pagination = ref({ page: 1, totalPages: 1, total: 0 });
  const pendingCount = ref(0);

  // ─── GETTERS ───────────────────────────────────────────────────────────────
  const overdueList = computed(() =>
    borrows.value.filter((b) => {
      if (b.status !== "approved") return false;
      return new Date() > new Date(b.dueDate);
    }),
  );

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách phiếu mươn theo status + phân trang
   */
  async function fetchBorrows({
    status = "pending",
    page = 1,
    limit = 10,
    search = "",
  } = {}) {
    isLoading.value = true;
    try {
      const { data } = await api.get("/borrows", {
        params: { status, page, limit, search },
      });
      borrows.value = data.borrows || data;
      pagination.value = {
        page: data.page || page,
        totalPages: data.totalPages || 1,
        total: data.total || 0,
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Lấy số phiếu đang chờ duyệt
   */
  async function fetchPendingCount() {
    const { data } = await api.get("/borrows/count", {
      params: { status: "pending" },
    });
    pendingCount.value = data.count || 0;
  }

  /**
   * Duyệt yêu cầu mượn sách
   */
  async function approveBorrow(borrowId) {
    const { data } = await api.patch(`/borrows/${borrowId}/approve`);
    _updateLocalBorrow(borrowId, { status: "approved" });
    pendingCount.value = Math.max(0, pendingCount.value - 1);
    return data;
  }

  /**
   * Từ chối yêu cầu mượn sách
   */
  async function rejectBorrow(borrowId, reason) {
    const { data } = await api.patch(`/borrows/${borrowId}/reject`, { reason });
    _updateLocalBorrow(borrowId, { status: "rejected" });
    pendingCount.value = Math.max(0, pendingCount.value - 1);
    return data;
  }

  /**
   * Xác nhận trả sách
   */
  async function returnBook(
    borrowId,
    { fineType, fineAmount, damagePercent, note },
  ) {
    const { data } = await api.patch(`/borrows/${borrowId}/return`, {
      fineType,
      fineAmount,
      damagePercent,
      note,
    });
    _updateLocalBorrow(borrowId, { status: "returned", fineAmount });
    return data;
  }

  /**
   * Gia hạn mượn sách
   */
  async function extendBorrow(borrowId, days) {
    const { data } = await api.patch(`/borrows/${borrowId}/extend`, { days });
    _updateLocalBorrow(borrowId, { dueDate: data.dueDate });
    return data;
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  function _updateLocalBorrow(borrowId, updates) {
    const index = borrows.value.findIndex((b) => b.id === borrowId);
    if (index > -1) {
      borrows.value[index] = { ...borrows.value[index], ...updates };
    }
  }

  return {
    // state
    borrows,
    isLoading,
    pagination,
    pendingCount,
    // getters
    overdueList,
    // actions
    fetchBorrows,
    fetchPendingCount,
    approveBorrow,
    rejectBorrow,
    returnBook,
    extendBorrow,
  };
});
