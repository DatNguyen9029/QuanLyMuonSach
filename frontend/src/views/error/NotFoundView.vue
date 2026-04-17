<template>
  <div
    class="flex-center w-screen h-screen bg-gradient-to-br from-gray-50 to-gray-100"
  >
    <div class="text-center px-4 sm:px-6 max-w-md animate-fade-in">
      <!-- 404 Icon -->
      <div class="mb-8">
        <div class="text-8xl font-bold text-primary-400 leading-none">404</div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        Trang không tìm thấy
      </h1>

      <!-- Description -->
      <p class="text-lg text-gray-600 mb-8">
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
        Nếu bạn cho rằng đây là lỗi, vui lòng
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
