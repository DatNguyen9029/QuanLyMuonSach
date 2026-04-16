// src/stores/borrow.store.js
import { defineStore } from "pinia";
import { ref, computed } from "pinia";
import { ref as vRef, computed as vComputed } from "vue";
import api from "@/services/api";

export const useBorrowStore = defineStore("borrow", () => {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  const borrows = vRef([]);
  const isLoading = vRef(false);
  const pagination = vRef({ page: 1, totalPages: 1, total: 0 });
  const pendingCount = vRef(0);

  // ─── GETTERS ───────────────────────────────────────────────────────────────
  const overdueList = vComputed(() =>
    borrows.value.filter((b) => {
      if (b.status !== "approved") return false;
      return new Date() > new Date(b.dueDate);
    }),
  );

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách phiếu mượn theo status + phân trang
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
      borrows.value = data.borrows;
      pagination.value = {
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Lấy số phiếu đang chờ duyệt (hiển thị badge)
   */
  async function fetchPendingCount() {
    const { data } = await api.get("/borrows/count", {
      params: { status: "pending" },
    });
    pendingCount.value = data.count;
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
   * Xác nhận trả sách (kèm tiền phạt nếu có)
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
    _updateLocalBorrow(borrowId, {
      dueDate: data.newDueDate,
      isExtended: true,
    });
    return data;
  }

  /**
   * Tạo phiếu mượn mới (thủ thư tạo thay độc giả)
   */
  async function createBorrow(payload) {
    const { data } = await api.post("/borrows", payload);
    borrows.value.unshift(data.borrow);
    return data;
  }

  // ─── PRIVATE HELPERS ───────────────────────────────────────────────────────
  function _updateLocalBorrow(id, updates) {
    const idx = borrows.value.findIndex((b) => b._id === id);
    if (idx !== -1) {
      borrows.value[idx] = { ...borrows.value[idx], ...updates };
    }
  }

  return {
    borrows,
    isLoading,
    pagination,
    pendingCount,
    overdueList,
    fetchBorrows,
    fetchPendingCount,
    approveBorrow,
    rejectBorrow,
    returnBook,
    extendBorrow,
    createBorrow,
  };
});
