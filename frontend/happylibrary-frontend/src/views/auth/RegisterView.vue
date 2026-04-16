<template>
  <div class="w-full max-w-sm">
    <h2 class="text-2xl font-bold text-gray-800 mb-1">Đăng ký</h2>
    <p class="text-sm text-gray-400 mb-7">
      Tạo tài khoản để bắt đầu sử dụng Happy Library
    </p>

    <!-- Google OAuth button -->
    <a
      :href="googleLoginUrl"
      class="flex items-center justify-center gap-3 w-full py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 mb-5"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Đăng ký với Google
    </a>

    <div class="flex items-center gap-3 mb-5">
      <div class="flex-1 h-px bg-gray-200"></div>
      <span class="text-xs text-gray-400">hoặc</span>
      <div class="flex-1 h-px bg-gray-200"></div>
    </div>

    <!-- Email / Password form -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5"
          >Họ và tên</label
        >
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Nguyễn Văn A"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
        />
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5"
          >Email</label
        >
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="example@email.com"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
        />
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5"
          >Mật khẩu</label
        >
        <input
          v-model="form.password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
        />
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5"
          >Xác nhận mật khẩu</label
        >
        <input
          v-model="form.confirmPassword"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
        />
      </div>
      <p
        v-if="error"
        class="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg"
      >
        {{ error }}
      </p>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 rounded-xl bg-[#0F1729] text-white text-sm font-bold hover:bg-[#1a2540] transition-colors disabled:opacity-60"
      >
        {{ loading ? "Đang đăng ký..." : "Đăng ký" }}
      </button>
    </form>

    <!-- Login link -->
    <p class="text-center text-xs text-gray-600 mt-4">
      Đã có tài khoản?
      <RouterLink
        to="/login"
        class="text-amber-600 hover:text-amber-700 font-semibold"
      >
        Đăng nhập
      </RouterLink>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RouterLink } from "vue-router";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";

const router = useRouter();
const authStore = useAuthStore();

const googleLoginUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/auth/google`;
const form = ref({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const loading = ref(false);
const error = ref("");

async function handleRegister() {
  error.value = "";

  // Validate
  if (!form.value.name || !form.value.email || !form.value.password) {
    error.value = "Vui lòng điền đầy đủ thông tin";
    return;
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = "Mật khẩu không khớp";
    return;
  }

  if (form.value.password.length < 6) {
    error.value = "Mật khẩu phải có ít nhất 6 ký tự";
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.post("/auth/register", {
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
    });

    if (data.token) {
      localStorage.setItem("hl_token", data.token);
      authStore.setUser(data.user);
      await router.push("/dashboard");
    }
  } catch (err) {
    error.value = err.response?.data?.message || "Đăng ký thất bại";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Component-specific styles */
</style>
