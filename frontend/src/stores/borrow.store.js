import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";

const STATUS_MAP = {
  pending: "ChoDuyet",
  approved: "DangMuon",
  returned: "DaTra",
  rejected: "TuChoi",
  lost: "MatSach",
};

const REVERSE_STATUS_MAP = {
  ChoDuyet: "pending",
  DangMuon: "approved",
  DaTra: "returned",
  TuChoi: "rejected",
  MatSach: "lost",
};

const STATUS_LABEL_MAP = {
  pending: "Chờ duyệt",
  approved: "Đang mượn",
  returned: "Đã trả",
  rejected: "Từ chối",
  lost: "Mất sách",
  overdue: "Quá hạn",
};

export const useBorrowStore = defineStore("borrow", () => {
  const authStore = useAuthStore();

  const borrows = ref([]);
  const isLoading = ref(false);
  const pagination = ref({ page: 1, totalPages: 1, total: 0 });
  const pendingCount = ref(0);

  function normalizeBorrow(record) {
    const user =
      record.user && typeof record.user === "object" ? record.user : null;
    const book =
      record.book && typeof record.book === "object" ? record.book : null;

    const backendStatus = record.trangThai || record.status || "ChoDuyet";
    const isOverdue =
      Boolean(record.isOverdue) ||
      (backendStatus === "DangMuon" && Boolean(record.overdueDays > 0));
    const uiStatus = isOverdue
      ? "overdue"
      : REVERSE_STATUS_MAP[backendStatus] || "pending";

    return {
      _id: record._id,
      id: record._id,
      borrowCode: record._id?.slice(-6)?.toUpperCase() || "------",
      backendStatus,
      status: uiStatus,
      statusLabel: STATUS_LABEL_MAP[uiStatus] || STATUS_LABEL_MAP.pending,
      isOverdue,
      overdueDays: record.overdueDays || 0,
      borrowDate: record.ngayMuon,
      dueDate: record.ngayHenTra,
      returnedDate: record.ngayTraThucTe,
      fineAmount: Number(
        record.tienPhat || record.tienPhatTamTinh || record.finePreview || 0,
      ),
      compensated: Boolean(record.daDenBu),
      compensatedAt: record.ngayDenBu || null,
      rejectReason: record.lyDoTuChoi || "",
      note: record.ghiChu || "",
      displayStatus: record.displayStatus || backendStatus,
      reader: user
        ? {
            id: user._id,
            name: user.hoTen,
            email: user.email,
            phone: user.dienThoai,
            role: user.role,
            avatar: user.avatar,
            isBlacklisted: Boolean(user.isBlacklisted),
            blacklistReason: user.blacklistReason || "",
            blacklistedAt: user.blacklistedAt || null,
          }
        : null,
      book: book
        ? {
            id: book._id,
            title: book.tenSach,
            author: book.tacGia,
            image: book.hinhAnh,
            price: Number(book.donGia || 0),
            stock: book.soLuongTienTai ?? 0,
            publisher: book.tenNXB || "",
          }
        : null,
    };
  }

  const overdueList = computed(() =>
    borrows.value.filter((b) => b.status === "overdue"),
  );

  async function fetchBorrows(params = {}) {
    isLoading.value = true;
    try {
      // [ROLE CHECK] Reader không được gọi danh sách toàn hệ thống
      const endpoint = authStore.isAdmin ? "/borrows" : "/borrows/my";
      const requestParams = { ...params };

      if (requestParams.status && !requestParams.trangThai) {
        requestParams.trangThai =
          STATUS_MAP[requestParams.status] || requestParams.status;
        delete requestParams.status;
      }

      const { data } = await api.get(endpoint, { params: requestParams });
      borrows.value = (data.data || []).map(normalizeBorrow);

      pagination.value = data.pagination || {
        page: data.page || 1,
        totalPages: Math.max(
          1,
          Math.ceil(
            (data.total || 0) / (data.limit || requestParams.limit || 10),
          ),
        ),
        total: data.total || 0,
      };

      return data;
    } catch (err) {
      console.error("Fetch borrows error:", err.message);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchMyBorrows() {
    isLoading.value = true;
    try {
      const { data } = await api.get("/borrows/my");
      borrows.value = (data.data || []).map(normalizeBorrow);
      return data;
    } catch (err) {
      console.error("Fetch my borrows error:", err.message);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchBorrowDetail(id) {
    const { data } = await api.get(`/borrows/${id}`);
    return normalizeBorrow(data.data || data);
  }

  async function fetchPendingCount() {
    if (!authStore.isAdmin) {
      pendingCount.value = 0;
      return 0;
    }
    const { data } = await api.get("/borrows", {
      params: { trangThai: "ChoDuyet", limit: 1 },
    });
    pendingCount.value = data.pagination?.total || data.total || 0;
    return pendingCount.value;
  }

  // Reader tạo phiếu mượn
  async function createBorrowRequest(payload) {
    const { data } = await api.post("/borrows", payload);
    const created = normalizeBorrow(data.data);
    borrows.value = [created, ...borrows.value];
    pagination.value.total = (pagination.value.total || 0) + 1;
    return created;
  }

  // Admin tạo phiếu mượn trực tiếp
  async function createAdminBorrow(payload) {
    // [ROLE CHECK] chỉ Admin mới gọi endpoint này
    if (!authStore.isAdmin)
      throw new Error("Không có quyền tạo phiếu mượn trực tiếp.");

    const { data } = await api.post("/borrows/admin", payload);
    const createdBorrows = (data.data || []).map(normalizeBorrow);
    borrows.value = [...createdBorrows, ...borrows.value];
    pagination.value.total =
      (pagination.value.total || 0) + createdBorrows.length;
    return createdBorrows;
  }

  async function approveBorrow(borrowId) {
    const { data } = await api.patch(`/borrows/${borrowId}/status`, {
      trangThai: "DangMuon",
    });
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    if (authStore.isAdmin)
      pendingCount.value = Math.max(0, pendingCount.value - 1);
    return data;
  }

  async function rejectBorrow(borrowId, reason) {
    const { data } = await api.patch(`/borrows/${borrowId}/status`, {
      trangThai: "TuChoi",
      lyDoTuChoi: reason,
    });
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    if (authStore.isAdmin)
      pendingCount.value = Math.max(0, pendingCount.value - 1);
    return data;
  }

  async function returnBook(
    borrowId,
    { markAsLost = false, compensated = false, blacklistReason = "" } = {},
  ) {
    const payload = {
      trangThai: markAsLost ? "MatSach" : "DaTra",
    };

    if (markAsLost) {
      payload.daDenBu = Boolean(compensated);
      if (!payload.daDenBu && blacklistReason?.trim()) {
        payload.blacklistReason = blacklistReason.trim();
      }
    }

    const { data } = await api.patch(`/borrows/${borrowId}/status`, payload);
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    return data;
  }

  async function extendBorrow(borrowId, days) {
    const { data } = await api.patch(`/borrows/${borrowId}/extend`, { days });
    _updateLocalBorrow(borrowId, normalizeBorrow(data.data));
    return data;
  }

  function _updateLocalBorrow(borrowId, updates) {
    const index = borrows.value.findIndex((b) => b._id === borrowId);
    if (index > -1) {
      borrows.value[index] = { ...borrows.value[index], ...updates };
    }
  }

  return {
    borrows,
    isLoading,
    pagination,
    pendingCount,
    overdueList,
    fetchBorrows,
    fetchMyBorrows,
    fetchBorrowDetail,
    fetchPendingCount,
    createBorrowRequest,
    createAdminBorrow,
    approveBorrow,
    rejectBorrow,
    returnBook,
    extendBorrow,
  };
});
