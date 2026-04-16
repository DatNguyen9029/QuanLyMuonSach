<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center p-4"
  >
    <!-- Left side - Branding -->
    <div
      class="hidden lg:flex lg:w-1/2 flex-col justify-center items-center text-white"
    >
      <div class="max-w-md">
        <!-- Logo -->
        <div class="flex items-center gap-3 mb-8">
          <div
            class="w-12 h-12 bg-white rounded-lg flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16v2H4V6m0 5h16v2H4v-2m0 5h16v2H4v-2z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold">Happy Library</h1>
        </div>

        <!-- Tagline -->
        <h2 class="text-4xl font-bold mb-4">Thư viện Số Hiện đại</h2>
        <p class="text-lg text-blue-100 mb-8">
          Quản lý mượn sách hiệu quả với nền tảng số hoàn toàn. Kết nối độc giả
          với tài liệu yêu thích một cách dễ dàng.
        </p>

        <!-- Features -->
        <ul class="space-y-4">
          <li class="flex items-center gap-3">
            <svg
              class="w-6 h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-lg">Quản lý sách dễ dàng</span>
          </li>
          <li class="flex items-center gap-3">
            <svg
              class="w-6 h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-lg">Theo dõi mượn/trả</span>
          </li>
          <li class="flex items-center gap-3">
            <svg
              class="w-6 h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-lg">Chat real-time</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Right side - Auth Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
// Auth layout - no additional logic needed
</script>

<style scoped>
/* Animations for entrance */
:deep(.animate-fade-in) {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
