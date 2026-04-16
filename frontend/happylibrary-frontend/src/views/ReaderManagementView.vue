<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Quản lý Độc giả</h1>
        <p class="text-gray-600">
          Quản lý danh sách độc giả / thành viên thư viện
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="btn btn-primary flex items-center gap-2"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Thêm Độc giả
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="mb-6 space-y-4">
      <div class="flex gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm độc giả..."
          class="form-control flex-1"
        />
        <select v-model="selectedStatus" class="form-control w-48">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
          <option value="suspended">Tạm khóa</option>
        </select>
      </div>
    </div>

    <!-- Readers Table -->
    <div class="card">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin">
          <svg
            class="w-8 h-8 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
      </div>

      <!-- Readers list -->
      <div v-else class="overflow-x-auto">
        <table class="w-full table-auto">
          <thead>
            <tr class="border-b border-gray-200">
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                ID
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Họ tên
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Email
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Điện thoại
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Trạng thái
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Ngày tham gia
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="reader in filteredReaders"
              :key="reader.id"
              class="border-b border-gray-200 hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm text-gray-700">{{ reader.id }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ reader.name }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ reader.email }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ reader.phone }}
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  class="inline-flex px-3 py-1 text-xs font-semibold rounded-full"
                  :class="{
                    'bg-success-100 text-success-800':
                      reader.status === 'active',
                    'bg-gray-100 text-gray-800': reader.status === 'inactive',
                    'bg-danger-100 text-danger-800':
                      reader.status === 'suspended',
                  }"
                >
                  {{ statusLabel(reader.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ formatDate(reader.joinDate) }}
              </td>
              <td class="px-4 py-3 space-x-2">
                <button
                  @click="editReader(reader)"
                  class="btn btn-secondary text-xs"
                >
                  Sửa
                </button>
                <button
                  @click="deleteReader(reader.id)"
                  class="btn btn-danger text-xs"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
        <div
          v-if="filteredReaders.length === 0"
          class="py-8 text-center text-gray-500"
        >
          Không tìm thấy độc giả nào
        </div>
      </div>
    </div>

    <!-- Reader Form Modal (if needed) -->
    <!-- Add modal component here -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const searchQuery = ref("");
const selectedStatus = ref("");
const loading = ref(false);
const readers = ref([]);

onMounted(async () => {
  loading.value = true;
  try {
    // Mock data
    readers.value = [
      {
        id: "RD-001",
        name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        phone: "0901234567",
        status: "active",
        joinDate: new Date("2024-01-15"),
      },
      {
        id: "RD-002",
        name: "Trần Thị B",
        email: "tranthib@example.com",
        phone: "0912345678",
        status: "active",
        joinDate: new Date("2024-02-20"),
      },
      {
        id: "RD-003",
        name: "Lê Văn C",
        email: "levanc@example.com",
        phone: "0923456789",
        status: "inactive",
        joinDate: new Date("2024-03-10"),
      },
    ];
  } finally {
    loading.value = false;
  }
});

const filteredReaders = computed(() => {
  let result = readers.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (reader) =>
        reader.name.toLowerCase().includes(query) ||
        reader.email.toLowerCase().includes(query) ||
        reader.phone.includes(query),
    );
  }

  if (selectedStatus.value) {
    result = result.filter((reader) => reader.status === selectedStatus.value);
  }

  return result;
});

const statusLabel = (status) => {
  const labels = {
    active: "Hoạt động",
    inactive: "Không hoạt động",
    suspended: "Tạm khóa",
  };
  return labels[status] || status;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN");
};

const openCreateModal = () => {
  // TODO: Implement modal
};

const editReader = (reader) => {
  console.log("Edit reader:", reader);
  // TODO: Implement edit functionality
};

const deleteReader = (readerId) => {
  if (confirm("Bạn chắc chắn muốn xóa độc giả này?")) {
    readers.value = readers.value.filter((r) => r.id !== readerId);
  }
};
</script>

<style scoped>
/* Component-specific styles */
</style>
