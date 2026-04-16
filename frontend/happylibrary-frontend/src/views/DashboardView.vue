<template>
  <!-- DashboardView.vue -->
  <div class="space-y-6">
    <!-- Loading Spinner -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"
      ></div>
      <span class="ml-3 text-lg text-gray-600">Đang tải dữ liệu...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-20">
      <div class="text-4xl mb-4">⚠️</div>
      <h3 class="text-xl font-bold text-gray-800 mb-2">{{ loadError }}</h3>
      <button
        @click="loadDashboardData"
        class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Thử lại
      </button>
    </div>

    <!-- Content -->
    <template v-else>
      <div>
        <h2 class="text-xl font-bold text-gray-800">
          Xin chào, {{ authStore.user?.hoTen }} 👋
        </h2>
        <p class="text-sm text-gray-400 mt-0.5">
          Đây là tổng quan hệ thống thư viện hôm nay
        </p>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div>
              <p
                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                {{ card.label }}
              </p>
              <p class="text-3xl font-bold mt-1" :class="card.color">
                {{ card.value }}
              </p>
            </div>
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :class="card.bg"
            >
              <span class="text-lg">{{ card.icon }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-3">{{ card.sub }}</p>
        </div>
      </div>

      <!-- Recent borrows -->
      <div
        class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-gray-100"
        >
          <h3 class="text-sm font-bold text-gray-700">Yêu cầu mượn gần đây</h3>
          <router-link
            to="/borrows"
            class="text-xs text-amber-600 font-semibold hover:underline"
            >Xem tất cả →</router-link
          >
        </div>
        <div
          v-if="recentBorrows.length === 0"
          class="py-10 text-center text-sm text-gray-400"
        >
          Chưa có yêu cầu nào
        </div>
        <div
          v-for="r in recentBorrows"
          :key="r._id"
          class="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
        >
          <img
            :src="`https://ui-avatars.com/api/?name=\${r.user?.hoTen}&size=36&background=FEF3C7&color=92400E`"
            class="w-9 h-9 rounded-full"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">
              {{ r.book?.tenSach }}
            </p>
            <p class="text-xs text-gray-400">{{ r.user?.hoTen }}</p>
          </div>
          <span
            class="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold"
            :class="
              r.trangThai === 'ChoDuyet'
                ? 'bg-amber-100 text-amber-700'
                : r.trangThai === 'DangMuon'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
            "
          >
            {{
              { ChoDuyet: "Chờ duyệt", DangMuon: "Đang mượn", DaTra: "Đã trả" }[
                r.trangThai
              ]
            }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";

const authStore = useAuthStore();
const recentBorrows = ref([]);
const statCards = ref([
  {
    label: "Tổng sách",
    value: "—",
    icon: "📚",
    color: "text-[#0F1729]",
    bg: "bg-amber-50",
    sub: "Đầu sách trong thư viện",
  },
  {
    label: "Đang mượn",
    value: "—",
    icon: "📖",
    color: "text-blue-600",
    bg: "bg-blue-50",
    sub: "Phiếu mượn đang hoạt động",
  },
  {
    label: "Chờ duyệt",
    value: "—",
    icon: "⏳",
    color: "text-amber-500",
    bg: "bg-amber-50",
    sub: "Yêu cầu cần xử lý",
  },
  {
    label: "Độc giả",
    value: "—",
    icon: "👥",
    color: "text-green-600",
    bg: "bg-green-50",
    sub: "Người dùng đăng ký",
  },
]);
const isLoading = ref(false);
const loadError = ref("");

async function loadDashboardData() {
  isLoading.value = true;
  loadError.value = "";
  try {
    if (authStore.isAdmin) {
      const [booksRes, borrowsRes, pendingRes, usersRes, recentRes] =
        await Promise.allSettled([
          api.get("/books", { params: { limit: 1 } }),
          api.get("/borrows", { params: { trangThai: "DangMuon", limit: 1 } }),
          api.get("/borrows", { params: { trangThai: "ChoDuyet", limit: 1 } }),
          api.get("/users", { params: { limit: 1 } }),
          api.get("/borrows", { params: { limit: 5 } }),
        ]);

      statCards.value[0].value =
        booksRes.status === "fulfilled" ? booksRes.value.data.total || 0 : "—";
      statCards.value[1].value =
        borrowsRes.status === "fulfilled"
          ? borrowsRes.value.data.total || 0
          : "—";
      statCards.value[2].value =
        pendingRes.status === "fulfilled"
          ? pendingRes.value.data.total || 0
          : "—";
      statCards.value[3].value =
        usersRes.status === "fulfilled" ? usersRes.value.data.total || 0 : "—";
      recentBorrows.value =
        recentRes.status === "fulfilled" ? recentRes.value.data.data || [] : [];
      return;
    }

    const [booksRes, myBorrowsRes] = await Promise.allSettled([
      api.get("/books", { params: { limit: 1 } }),
      api.get("/borrows/my"),
    ]);

    const myBorrows =
      myBorrowsRes.status === "fulfilled"
        ? myBorrowsRes.value.data.data || []
        : [];

    statCards.value[0].value =
      booksRes.status === "fulfilled" ? booksRes.value.data.total || 0 : "—";
    statCards.value[1].value = myBorrows.filter(
      (borrow) => borrow.trangThai === "DangMuon",
    ).length;
    statCards.value[2].value = myBorrows.filter(
      (borrow) => borrow.trangThai === "ChoDuyet",
    ).length;
    statCards.value[3].value = "—";
    recentBorrows.value = myBorrows.slice(0, 5);
  } catch (error) {
    loadError.value = "Không thể tải dữ liệu dashboard";
    console.error("Dashboard load error:", error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadDashboardData);
</script>
