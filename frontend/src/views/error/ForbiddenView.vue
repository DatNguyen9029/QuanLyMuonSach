<template>
  <div
    class="flex-center w-screen h-screen bg-gradient-to-br from-red-50 to-orange-50"
  >
    <div class="text-center px-4 sm:px-6 max-w-md animate-fade-in">
      <!-- 403 Icon -->
      <div class="mb-8">
        <div class="text-8xl font-bold text-danger-400 leading-none">403</div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        Truy cập bị từ chối
      </h1>

      <!-- Description -->
      <p class="text-lg text-gray-600 mb-8">
        Bạn không có quyền truy cập vào tài nguyên này. Vui lòng liên hệ với
        quản trị viên để được cấp quyền.
      </p>

      <!-- Illustration -->
      <div class="mb-8 h-48 flex-center">
        <svg
          class="w-32 h-32 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <RouterLink to="/dashboard" class="inline-block btn btn-primary w-full">
          ← Về Trang chủ
        </RouterLink>
        <button class="btn btn-secondary w-full" @click="$router.back()">
          ← Quay lại
        </button>
      </div>

      <!-- Help text -->
      <p class="text-sm text-gray-500 mt-6">
        Nếu bạn cho rằng bạn nên có quyền truy cập, vui lòng
        <RouterLink to="/chat" class="text-primary-600 hover:text-primary-700">
          liên hệ với admin
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
/* Add additional styles if needed */
</style>
