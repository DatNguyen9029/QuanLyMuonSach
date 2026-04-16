<template>
  <div
    class="flex-center w-screen h-screen bg-gradient-to-br from-blue-50 to-cyan-50"
  >
    <div class="text-center px-4 sm:px-6 max-w-md animate-fade-in">
      <!-- Loading icon -->
      <div class="mb-8 flex-center">
        <div class="animate-spin">
          <svg
            class="w-16 h-16 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        Đang xác thực...
      </h1>

      <!-- Description -->
      <p class="text-lg text-gray-600 mb-4">
        Vui lòng chờ trong khi chúng tôi hoàn tất quá trình xác thực.
      </p>

      <!-- Status messages -->
      <div class="space-y-2 text-sm text-gray-500">
        <p>✓ Kết nối với máy chủ</p>
        <p class="animate-pulse-subtle">⟳ Xác thực thông tin đăng nhập...</p>
      </div>

      <!-- Timeout message -->
      <div
        v-if="showTimeout"
        class="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
      >
        <p class="text-sm text-yellow-800">
          Quá trình xác thực đang mất thời gian.
          <RouterLink
            to="/login"
            class="font-semibold text-yellow-900 hover:underline"
          >
            Quay lại đăng nhập
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const showTimeout = ref(false);

onMounted(async () => {
  // Timeout after 30 seconds
  const timeoutId = setTimeout(() => {
    showTimeout.value = true;
  }, 30000);

  try {
    // Đợi cho đến khi auth store hoàn tất loading
    // Hoặc thực hiện xác thực OAuth ở đây
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code) {
      // Xử lý OAuth callback
      // await authStore.handleOAuthCallback(code, state);
      // Tạm thời redirect về dashboard
      router.replace("/dashboard");
    } else {
      router.replace("/dashboard");
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    router.replace("/login");
  } finally {
    clearTimeout(timeoutId);
  }
});
</script>

<style scoped>
/* Add additional styles if needed */
</style>
