<template>
  <!-- DashboardView.vue -->
  <div class="space-y-6">
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
          :src="`https://ui-avatars.com/api/?name=${r.user?.hoTen}&size=36&background=FEF3C7&color=92400E`"
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

onMounted(async () => {
  try {
    const requests = [
      api.get("/books", { params: { limit: 1 } }),
      api.get("/borrows", { params: { trangThai: "DangMuon", limit: 1 } }),
      api.get("/borrows", { params: { trangThai: "ChoDuyet", limit: 1 } }),
      api.get("/borrows", { params: { limit: 5 } }),
    ];

    if (authStore.isAdmin) {
      requests.splice(3, 0, api.get("/users", { params: { limit: 1 } }));
    }

    const responses = await Promise.all(requests);
    const booksRes = responses[0];
    const borrowsRes = responses[1];
    const pendingRes = responses[2];
    const usersRes = authStore.isAdmin ? responses[3] : null;
    const recentRes = authStore.isAdmin ? responses[4] : responses[3];

    statCards.value[0].value = booksRes.data.total;
    statCards.value[1].value = borrowsRes.data.total;
    statCards.value[2].value = pendingRes.data.total;
    statCards.value[3].value = usersRes?.data.total ?? "—";
    recentBorrows.value = recentRes.data.data;
  } catch {
    /* silent fail */
  }
});
</script>
