<template>
  <div class="reader-dashboard space-y-6">
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      <span class="ml-3 text-lg text-gray-600">Đang tải dữ liệu...</span>
    </div>

    <template v-else>
      <div v-if="loadError" class="warning-banner">
        <span>⚠️</span>
        <p>{{ loadError }}</p>
        <button @click="loadDashboardData">Thử tải lại</button>
      </div>

      <section class="hero-card">
        <div class="hero-left">
          <p class="hero-role">
            <span class="role-icon">{{ isAdmin ? "🛡️" : "🧑‍🎓" }}</span>
            <span>Vai trò: {{ roleLabel }}</span>
          </p>
          <h2 class="hero-title">Xin chào, {{ displayName }} 👋</h2>
          <p class="hero-subtitle">
            {{ isAdmin ? "Theo dõi toàn bộ phiếu mượn trong hệ thống." : "Quản lý sách đang mượn và yêu cầu mượn của bạn nhanh chóng tại đây." }}
          </p>
        </div>

        <div v-if="!isAdmin" class="hero-actions">
          <button class="btn btn-search" @click="goToBookCatalog">🔍 Tìm sách</button>
          <button class="btn btn-request" @click="goToBorrowRequest">➕ Gửi yêu cầu mượn</button>
        </div>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          v-for="card in statCards"
          :key="card.key"
          type="button"
          class="stat-card"
          :class="[card.variant, { 'stat-card--warning': card.isWarning }]"
          @click="handleCardClick(card.key)"
        >
          <div class="stat-top">
            <div class="stat-icon">{{ card.icon }}</div>
            <span class="stat-more">Chi tiết</span>
          </div>
          <p class="stat-label">{{ card.label }}</p>
          <p class="stat-value">{{ card.value }}</p>
          <p class="stat-sub">{{ card.sub }}</p>
        </button>
      </section>

      <section id="borrowed-section" class="panel-card">
        <div class="panel-header">
          <h3>Sách đang mượn</h3>
          <p class="panel-note">{{ borrowFilterLabel }}</p>
        </div>

        <div v-if="filteredCurrentBorrows.length === 0" class="empty-state">
          <div class="empty-illu">📚</div>
          <p class="empty-title">{{ isAdmin ? "Hiện chưa có sách đang mượn" : "Bạn chưa có sách đang mượn" }}</p>
          <p class="empty-desc">{{ isAdmin ? "Các phiếu đang mượn sẽ hiển thị tại đây." : "Hãy khám phá kho sách và gửi yêu cầu mượn mới." }}</p>
          <button v-if="!isAdmin" class="btn btn-search" @click="goToBookCatalog">🔍 Tìm sách</button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Tên sách</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
                <th>Trạng thái</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredCurrentBorrows" :key="item.id">
                <td class="font-medium text-gray-800">
                  {{ item.book?.title || "—" }}
                  <p v-if="isAdmin" class="text-xs text-gray-500 mt-1">{{ item.reader?.name || "Không rõ độc giả" }}</p>
                </td>
                <td>{{ formatDate(item.borrowDate) }}</td>
                <td>{{ formatDate(item.dueDate) }}</td>
                <td>
                  <span class="status-badge" :class="getBorrowStatusClass(item)">
                    {{ getBorrowStatusLabel(item) }}
                  </span>
                </td>
                <td>
                  <button class="text-sky-700 hover:underline font-semibold" @click="selectBorrow(item)">
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="request-section" class="panel-card">
        <div class="panel-header">
          <h3>Yêu cầu mượn gần đây</h3>
          <p class="panel-note">Tối đa 5 yêu cầu mới nhất</p>
        </div>

        <div v-if="recentRequests.length === 0" class="empty-state">
          <div class="empty-illu">📝</div>
          <p class="empty-title">Chưa có yêu cầu mượn gần đây</p>
          <p class="empty-desc">Các yêu cầu sẽ xuất hiện tại đây để theo dõi trạng thái.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Tên sách</th>
                <th>Ngày yêu cầu</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in recentRequests" :key="item.id">
                <td class="font-medium text-gray-800">
                  {{ item.book?.title || "—" }}
                  <p v-if="isAdmin" class="text-xs text-gray-500 mt-1">{{ item.reader?.name || "Không rõ độc giả" }}</p>
                </td>
                <td>{{ formatDate(item.borrowDate) }}</td>
                <td>
                  <span class="status-badge" :class="getRequestStatusClass(item.backendStatus)">
                    {{ getRequestStatusLabel(item.backendStatus) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="selectedBorrow" class="panel-card">
        <div class="panel-header">
          <h3>Chi tiết mượn sách</h3>
          <button class="text-gray-500 hover:text-gray-700" @click="selectedBorrow = null">Đóng</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm text-gray-700">
          <div>
            <p class="detail-label">Tên sách</p>
            <p class="detail-value">{{ selectedBorrow.book?.title || "—" }}</p>
          </div>
          <div>
            <p class="detail-label">Độc giả</p>
            <p class="detail-value">{{ selectedBorrow.reader?.name || displayName }}</p>
          </div>
          <div>
            <p class="detail-label">Ngày mượn</p>
            <p class="detail-value">{{ formatDate(selectedBorrow.borrowDate) }}</p>
          </div>
          <div>
            <p class="detail-label">Hạn trả</p>
            <p class="detail-value">{{ formatDate(selectedBorrow.dueDate) }}</p>
          </div>
          <div>
            <p class="detail-label">Trạng thái</p>
            <p class="detail-value">{{ getBorrowStatusLabel(selectedBorrow) }}</p>
          </div>
          <div>
            <p class="detail-label">Mã yêu cầu</p>
            <p class="detail-value">{{ selectedBorrow.id || "—" }}</p>
          </div>
        </div>
      </section>

      <button v-if="!isAdmin" class="fab-mobile" @click="goToBorrowRequest">➕</button>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useBorrowStore } from "@/stores/borrow.store";

const router = useRouter();
const authStore = useAuthStore();
const borrowStore = useBorrowStore();

const isLoading = ref(false);
const loadError = ref("");
const activeBorrowFilter = ref("all");
const selectedBorrow = ref(null);

const isAdmin = computed(() => authStore.isAdmin);
const roleLabel = computed(() => (isAdmin.value ? "Admin" : "Độc giả"));
const displayName = computed(() => authStore.user?.hoTen || roleLabel.value);
const borrows = computed(() => borrowStore.borrows || []);

const borrowingBorrows = computed(() =>
  borrows.value.filter((item) => item.backendStatus === "DangMuon"),
);

const pendingCount = computed(
  () => borrows.value.filter((item) => item.backendStatus === "ChoDuyet").length,
);

const returnedCount = computed(
  () => borrows.value.filter((item) => item.backendStatus === "DaTra").length,
);

const overdueCount = computed(
  () => borrows.value.filter((item) => item.status === "overdue").length,
);

const dueSoonCount = computed(
  () =>
    borrowingBorrows.value.filter((item) => {
      const days = getDaysUntilDue(item.dueDate);
      return days >= 0 && days <= 3;
    }).length,
);

const readerHistoryCount = computed(
  () =>
    borrows.value.filter((item) => ["DangMuon", "DaTra"].includes(item.backendStatus)).length,
);

const filteredCurrentBorrows = computed(() => {
  if (activeBorrowFilter.value === "dueSoon") {
    return borrowingBorrows.value.filter((item) => getBorrowStatusLabel(item) === "Sắp trễ");
  }
  return borrowingBorrows.value;
});

const borrowFilterLabel = computed(() => {
  if (activeBorrowFilter.value === "dueSoon") return "Đang hiển thị: Sắp trễ";
  return "Đang hiển thị: Tất cả sách đang mượn";
});

const recentRequests = computed(() =>
  [...borrows.value]
    .sort((a, b) => new Date(b.borrowDate || 0) - new Date(a.borrowDate || 0))
    .slice(0, 5),
);

const statCards = computed(() => {
  if (isAdmin.value) {
    return [
      {
        key: "borrowing",
        label: "Sách đang mượn",
        value: borrowingBorrows.value.length,
        icon: "📚",
        variant: "card-blue",
        sub: "Đang mượn toàn hệ thống",
      },
      {
        key: "pending",
        label: "Yêu cầu chờ duyệt",
        value: pendingCount.value,
        icon: "📝",
        variant: "card-violet",
        sub: "Cần xử lý",
      },
      {
        key: "returned",
        label: "Sách đã trả",
        value: returnedCount.value,
        icon: "📖",
        variant: "card-green",
        sub: "Đã hoàn tất trả",
      },
      {
        key: "overdue",
        label: "Đang quá hạn",
        value: overdueCount.value,
        icon: "⏰",
        variant: "card-amber",
        sub: "Cần theo dõi gấp",
        isWarning: overdueCount.value > 0,
      },
    ];
  }

  return [
    {
      key: "all",
      label: "Sách đang mượn",
      value: borrowingBorrows.value.length,
      icon: "📚",
      variant: "card-blue",
      sub: "Số lượng bạn đang giữ",
    },
    {
      key: "dueSoon",
      label: "Sắp đến hạn trả",
      value: dueSoonCount.value,
      icon: "⏰",
      variant: "card-amber",
      sub: "Nên xử lý sớm",
      isWarning: dueSoonCount.value > 0,
    },
    {
      key: "pending",
      label: "Yêu cầu chờ duyệt",
      value: pendingCount.value,
      icon: "📝",
      variant: "card-violet",
      sub: "Đang chờ thư viện xác nhận",
    },
    {
      key: "history",
      label: "Tổng số sách đã mượn",
      value: readerHistoryCount.value,
      icon: "📖",
      variant: "card-green",
      sub: "Tổng lịch sử mượn sách",
    },
  ];
});

function getDaysUntilDue(dateValue) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const now = new Date();
  const dueDate = new Date(dateValue);
  const diff = dueDate.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getBorrowStatusLabel(item) {
  if (item.status === "overdue") return "Trễ hạn";
  const days = getDaysUntilDue(item.dueDate);
  if (days <= 3) return "Sắp trễ";
  return "Còn hạn";
}

function getBorrowStatusClass(item) {
  const status = getBorrowStatusLabel(item);
  if (status === "Trễ hạn") return "badge-red";
  if (status === "Sắp trễ") return "badge-amber";
  return "badge-green";
}

function getRequestStatusLabel(status) {
  if (status === "ChoDuyet") return "Chờ duyệt";
  if (status === "TuChoi") return "Từ chối";
  return "Đã duyệt";
}

function getRequestStatusClass(status) {
  if (status === "ChoDuyet") return "badge-amber";
  if (status === "TuChoi") return "badge-red";
  return "badge-blue";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleCardClick(key) {
  if (key === "dueSoon") {
    activeBorrowFilter.value = "dueSoon";
    scrollToSection("borrowed-section");
    return;
  }
  activeBorrowFilter.value = "all";
  if (["pending", "returned"].includes(key)) {
    scrollToSection("request-section");
    return;
  }
  scrollToSection("borrowed-section");
}

function goToBookCatalog() {
  router.push({ path: "/books", query: { source: "reader-dashboard" } });
}

function goToBorrowRequest() {
  router.push({
    path: "/books",
    query: { source: "reader-dashboard", action: "borrow-request" },
  });
}

function selectBorrow(item) {
  selectedBorrow.value = item;
}

async function loadDashboardData() {
  isLoading.value = true;
  loadError.value = "";

  try {
    if (isAdmin.value) {
      await borrowStore.fetchBorrows({ page: 1, limit: 9999 });
    } else {
      await borrowStore.fetchMyBorrows();
    }
  } catch (error) {
    loadError.value = "Không thể tải dữ liệu dashboard";
    console.error("Dashboard load error:", error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadDashboardData);
</script>

<style scoped>
.reader-dashboard {
  padding-bottom: 5rem;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  background: linear-gradient(135deg, #e0f2fe 0%, #f8fafc 45%, #fff7ed 100%);
  border: 1px solid #dbeafe;
  border-radius: 1rem;
  padding: 1.25rem;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid #f59e0b;
  background: #fffbeb;
  color: #92400e;
  border-radius: 0.75rem;
  padding: 0.65rem 0.85rem;
}

.warning-banner p {
  flex: 1;
  font-size: 0.85rem;
  margin: 0;
}

.warning-banner button {
  border: none;
  background: #f59e0b;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 0.55rem;
  padding: 0.4rem 0.7rem;
}

.warning-banner button:hover {
  background: #d97706;
}

.hero-role {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  background-color: #ecfeff;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 700;
}

.hero-title {
  margin-top: 0.75rem;
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 800;
}

.hero-subtitle {
  margin-top: 0.4rem;
  color: #475569;
  font-size: 0.95rem;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-search {
  background-color: #0ea5e9;
  color: white;
}

.btn-search:hover {
  background-color: #0284c7;
}

.btn-request {
  background-color: #f59e0b;
  color: white;
}

.btn-request:hover {
  background-color: #d97706;
}

.stat-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  padding: 1rem;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: #ffffff;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

.stat-card--warning {
  border-color: #f59e0b;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3);
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.stat-more {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
}

.stat-label {
  margin-top: 0.7rem;
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-weight: 700;
}

.stat-value {
  margin-top: 0.25rem;
  color: #0f172a;
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1;
}

.stat-sub {
  margin-top: 0.35rem;
  color: #475569;
  font-size: 0.8rem;
}

.card-blue .stat-icon {
  background: #e0f2fe;
}

.card-amber .stat-icon {
  background: #fef3c7;
}

.card-violet .stat-icon {
  background: #ede9fe;
}

.card-green .stat-icon {
  background: #dcfce7;
}

.panel-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid #f1f5f9;
}

.panel-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}

.panel-note {
  color: #64748b;
  font-size: 0.8rem;
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.dashboard-table th,
.dashboard-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.85rem 1.1rem;
  text-align: left;
  color: #334155;
  font-size: 0.9rem;
}

.dashboard-table th {
  color: #475569;
  background: #f8fafc;
  font-weight: 700;
  font-size: 0.8rem;
}

.status-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-green {
  background: #dcfce7;
  color: #166534;
}

.badge-amber {
  background: #fef3c7;
  color: #92400e;
}

.badge-red {
  background: #fee2e2;
  color: #991b1b;
}

.badge-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
}

.empty-illu {
  font-size: 2rem;
}

.empty-title {
  margin-top: 0.4rem;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 700;
}

.empty-desc {
  color: #64748b;
  font-size: 0.86rem;
  margin-top: 0.25rem;
  margin-bottom: 0.8rem;
}

.detail-label {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.detail-value {
  margin-top: 0.2rem;
  color: #0f172a;
  font-weight: 600;
}

.fab-mobile {
  display: none;
}

@media (max-width: 1024px) {
  .hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .reader-dashboard {
    padding-bottom: 6rem;
  }

  .fab-mobile {
    position: fixed;
    bottom: 1.1rem;
    right: 1rem;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 999px;
    border: none;
    background: #f59e0b;
    color: #ffffff;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.22);
    font-size: 1.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
}
</style>
