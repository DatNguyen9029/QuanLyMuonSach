<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p class="text-sm text-gray-500 mt-1">
          Quản lý thông tin tài khoản của bạn
        </p>
      </div>
      <div class="text-right">
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
          :class="
            authStore.isAdmin
              ? 'bg-purple-100 text-purple-800'
              : 'bg-green-100 text-green-800'
          "
        >
          {{ authStore.isAdmin ? "Quản trị viên" : "Độc giả" }}
        </span>
      </div>
    </div>

    <!-- Profile Card -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
      <div class="max-w-sm mx-auto text-center mb-8">
        <div
          class="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1"
        >
          <div
            class="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600"
          >
            {{ userInitial }}
          </div>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {{ authStore.user?.hoTen }}
        </h2>
        <p class="text-gray-500">{{ authStore.user?.email }}</p>
      </div>

      <!-- Edit Form -->
      <form
        @submit.prevent="updateProfile"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Họ tên</label
          >
          <input
            v-model="form.hoTen"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Số điện thoại</label
          >
          <input
            v-model="form.dienThoai"
            type="tel"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Địa chỉ</label
          >
          <textarea
            v-model="form.diaChi"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>
        <div class="md:col-span-2 flex gap-3 justify-end pt-4">
          <button
            type="button"
            @click="resetForm"
            class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            :disabled="isUpdating"
            class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <span v-if="isUpdating" class="animate-spin">⟳</span>
            {{ isUpdating ? "Đang cập nhật..." : "Cập nhật hồ sơ" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Change Password (Reader only) -->
    <div
      v-if="!authStore.isAdmin"
      class="bg-white rounded-xl border border-gray-200 shadow-sm p-8"
    >
      <div class="mb-6">
        <h3 class="text-xl font-bold text-gray-900">Đổi mật khẩu</h3>
        <p class="text-sm text-gray-500 mt-1">
          Cập nhật mật khẩu để bảo mật tài khoản của bạn
        </p>
      </div>

      <form
        @submit.prevent="changePassword"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Mật khẩu hiện tại</label
          >
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            autocomplete="current-password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Mật khẩu mới</label
          >
          <input
            v-model="passwordForm.newPassword"
            type="password"
            autocomplete="new-password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Xác nhận mật khẩu mới</label
          >
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div class="md:col-span-2 flex gap-3 justify-end pt-2">
          <button
            type="button"
            @click="resetPasswordForm"
            class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            :disabled="isChangingPassword"
            class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <span v-if="isChangingPassword" class="animate-spin">⟳</span>
            {{ isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/services/api";

const authStore = useAuthStore();
const isUpdating = ref(false);
const isChangingPassword = ref(false);
const form = ref({
  hoTen: "",
  dienThoai: "",
  diaChi: "",
});
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const userInitial = computed(() =>
  (authStore.user?.hoTen || "U").charAt(0).toUpperCase(),
);

function resetForm() {
  form.value = {
    hoTen: authStore.user?.hoTen || "",
    dienThoai: authStore.user?.dienThoai || "",
    diaChi: authStore.user?.diaChi || "",
  };
}

async function updateProfile() {
  isUpdating.value = true;
  try {
    const { data } = await api.put("/users/profile", form.value);
    authStore.user = data.data;
    alert("Cập nhật thành công!");
  } catch (error) {
    alert("Có lỗi xảy ra: " + error.message);
  } finally {
    isUpdating.value = false;
  }
}

function resetPasswordForm() {
  passwordForm.value = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

async function changePassword() {
  const payload = { ...passwordForm.value };

  if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword) {
    alert("Vui lòng nhập đầy đủ thông tin đổi mật khẩu.");
    return;
  }

  isChangingPassword.value = true;
  try {
    const { data } = await api.patch("/auth/change-password", payload);
    alert(data?.message || "Đổi mật khẩu thành công!");
    resetPasswordForm();
  } catch (error) {
    alert("Có lỗi xảy ra: " + error.message);
  } finally {
    isChangingPassword.value = false;
  }
}

onMounted(() => {
  resetForm();
  resetPasswordForm();
});
</script>

export default { name: "Profiles" }
