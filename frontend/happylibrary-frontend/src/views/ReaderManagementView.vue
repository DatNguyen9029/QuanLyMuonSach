<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Quản lý Độc giả</h1>
        <p class="text-gray-600">Quản lý tài khoản độc giả trong hệ thống</p>
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

    <div class="mb-6 space-y-4">
      <div class="flex gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm theo họ tên, username, email, số điện thoại..."
          class="form-control flex-1"
        />
        <select v-model="selectedRole" class="form-control w-48">
          <option value="">Tất cả vai trò</option>
          <option value="user">Độc giả</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>

    <div class="card">
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
                Username
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
                Vai trò
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
              :key="reader._id"
              class="border-b border-gray-200 hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm text-gray-700">{{ reader._id }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ reader.hoTen }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ reader.username }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ reader.email }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ reader.dienThoai || "—" }}
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  class="inline-flex px-3 py-1 text-xs font-semibold rounded-full"
                  :class="
                    reader.role === 'admin'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  "
                >
                  {{ reader.role === "admin" ? "Admin" : "Độc giả" }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ formatDate(reader.createdAt) }}
              </td>
              <td class="px-4 py-3 space-x-2">
                <button
                  @click="editReader(reader)"
                  class="btn btn-secondary text-xs"
                >
                  Sửa
                </button>
                <button
                  @click="removeReader(reader._id)"
                  class="btn btn-danger text-xs"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="filteredReaders.length === 0"
          class="py-8 text-center text-gray-500"
        >
          Không tìm thấy độc giả nào
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      >
        <AppModel
          :title="editingReader ? 'Cập nhật độc giả' : 'Thêm độc giả'"
          @close="closeModal"
          @submit="saveReader"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Họ tên</label>
                <input v-model="form.hoTen" class="form-control" type="text" />
              </div>
              <div>
                <label class="form-label">Username</label>
                <input
                  v-model="form.username"
                  class="form-control"
                  type="text"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Email</label>
                <input v-model="form.email" class="form-control" type="email" />
              </div>
              <div>
                <label class="form-label">Số điện thoại</label>
                <input
                  v-model="form.dienThoai"
                  class="form-control"
                  type="text"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Ngày sinh</label>
                <input
                  v-model="form.ngaySinh"
                  class="form-control"
                  type="date"
                />
              </div>
              <div>
                <label class="form-label">Giới tính</label>
                <select v-model="form.phai" class="form-control">
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">Địa chỉ</label>
              <input v-model="form.diaChi" class="form-control" type="text" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Vai trò</label>
                <select v-model="form.role" class="form-control">
                  <option value="user">Độc giả</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label class="form-label">
                  {{ editingReader ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu" }}
                </label>
                <input
                  v-model="form.password"
                  class="form-control"
                  type="password"
                />
              </div>
            </div>
          </div>
        </AppModel>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useReaderStore } from "@/stores/reader.store";
import AppModel from "@/components/common/AppModel.vue";

const readerStore = useReaderStore();
const searchQuery = ref("");
const selectedRole = ref("");
const loading = ref(false);
const showModal = ref(false);
const editingReader = ref(null);
const form = ref(createDefaultForm());

function createDefaultForm() {
  return {
    username: "",
    email: "",
    password: "",
    hoTen: "",
    dienThoai: "",
    ngaySinh: "",
    phai: "",
    diaChi: "",
    role: "user",
  };
}

onMounted(async () => {
  loading.value = true;
  try {
    await readerStore.fetchReaders();
  } finally {
    loading.value = false;
  }
});

const filteredReaders = computed(() => {
  let result = readerStore.readers;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (reader) =>
        reader.hoTen.toLowerCase().includes(query) ||
        reader.username.toLowerCase().includes(query) ||
        reader.email.toLowerCase().includes(query) ||
        (reader.dienThoai || "").includes(query),
    );
  }

  if (selectedRole.value) {
    result = result.filter((reader) => reader.role === selectedRole.value);
  }

  return result;
});

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "—";

const openCreateModal = () => {
  editingReader.value = null;
  form.value = createDefaultForm();
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingReader.value = null;
  form.value = createDefaultForm();
};

const editReader = (reader) => {
  editingReader.value = reader;
  form.value = {
    username: reader.username,
    email: reader.email,
    password: "",
    hoTen: reader.hoTen,
    dienThoai: reader.dienThoai || "",
    ngaySinh: reader.ngaySinh ? reader.ngaySinh.slice(0, 10) : "",
    phai: reader.phai || "",
    diaChi: reader.diaChi || "",
    role: reader.role || "user",
  };
  showModal.value = true;
};

const saveReader = async () => {
  const payload = { ...form.value };

  if (!payload.password) {
    delete payload.password;
  }

  try {
    if (editingReader.value?._id) {
      await readerStore.updateReader(editingReader.value._id, payload);
    } else {
      await readerStore.createReader(payload);
    }
    closeModal();
  } catch (error) {
    alert(error.message || "Không thể lưu độc giả");
  }
};

const removeReader = async (readerId) => {
  if (!confirm("Bạn chắc chắn muốn xóa độc giả này?")) return;

  try {
    await readerStore.deleteReader(readerId);
  } catch (error) {
    alert(error.message || "Không thể xóa độc giả");
  }
};
</script>

<style scoped>
/* Component-specific styles */
</style>

export default { name: "Readers" }
