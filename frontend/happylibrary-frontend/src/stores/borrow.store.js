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

  const statusMap = {
    pending: "ChoDuyet",
    approved: "DangMuon",
    returned: "DaTra",
    rejected: "TuChoi",
    lost: "MatSach",
  };

  const reverseStatusMap = {
    ChoDuyet: "pending",
    DangMuon: "approved",
    DaTra: "returned",
    TuChoi: "rejected",
    MatSach: "lost",
  };

  function normalizeBorrow(record) {
    return {
      _id: record._id,
      borrowCode: record._id?.slice(-6)?.toUpperCase() || "------",
      status: reverseStatusMap[record.trangThai] || record.trangThai,
      backendStatus: record.trangThai,
      borrowDate: record.ngayMuon,
      dueDate: record.ngayHenTra,
      returnedDate: record.ngayTraThucTe,
      fineAmount: record.tienPhat || record.tienPhatTamTinh || 0,
      rejectReason: record.lyDoTuChoi || "",
      reader: record.user
        ? {
            id: record.user._id,
            name: record.user.hoTen,
            email: record.user.email,
            phone: record.user.dienThoai,
          }
        : null,
      book: record.book
        ? {
            id: record.book._id,
            title: record.book.tenSach,
            author: record.book.tacGia,
            image: record.book.hinhAnh,
            price: record.book.donGia || 0,
          }
        : null,
    };
  }

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
  async function fetchBorrows(params = {}) {
    isLoading.value = true;
    try {
      const { data } = await api.get("/borrows", { params });
      borrows.value = (data.data || []).map(normalizeBorrow);
      pagination.value = data.pagination || {
        page: 1,
        totalPages: 1,
        total: 0,
      };
      return data;
    } catch (err) {
      // Log lỗi để debug nhưng không làm crash app
      console.error("Fetch borrows error:", err.message);
      throw err; // Ném lại để Component có thể hiển thị thông báo nếu cần
    } finally {
      isLoading.value = false;
    }
  }

  // Làm tương tự cho fetchMyBorrows
  async function fetchMyBorrows() {
    isLoading.value = true;
    try {
      const { data } = await api.get("/borrows/my");
      borrows.value = (data.data || []).map(normalizeBorrow);
    } catch (err) {
      console.error("Fetch my borrows error:", err.message);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Lấy số phiếu đang chờ duyệt
   */
  async function fetchPendingCount() {
    const { data } = await api.get("/borrows", {
      params: { trangThai: "ChoDuyet", limit: 1 },
    });
    pendingCount.value = data.total || 0;
  }

  /**
   * Duyệt yêu cầu mượn sách
   */
  async function approveBorrow(borrowId) {
    const { data } = await api.patch(`/borrows/${borrowId}/status`, {
      trangThai: "DangMuon",
    });
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    pendingCount.value = Math.max(0, pendingCount.value - 1);
    return data;
  }

  /**
   * Từ chối yêu cầu mượn sách
   */
  async function rejectBorrow(borrowId, reason) {
    const { data } = await api.patch(`/borrows/${borrowId}/status`, {
      trangThai: "TuChoi",
      lyDoTuChoi: reason,
    });
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    pendingCount.value = Math.max(0, pendingCount.value - 1);
    return data;
  }

  /**
   * Xác nhận trả sách
   */
  async function returnBook(borrowId, { markAsLost = false }) {
    const { data } = await api.patch(`/borrows/${borrowId}/status`, {
      trangThai: markAsLost ? "MatSach" : "DaTra",
    });
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    return data;
  }

  /**
   * Gia hạn mượn sách
   */
  async function extendBorrow(borrowId, days) {
    const { data } = await api.patch(`/borrows/${borrowId}/extend`, { days });
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    return data;
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  function _updateLocalBorrow(borrowId, updates) {
    const index = borrows.value.findIndex((b) => b._id === borrowId);
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
