<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div
        class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
      >
        <h3 class="text-xl font-bold text-gray-900">{{ title }}</h3>
        <button
          @click="$emit('close')"
          class="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
        <slot />
      </div>

      <div class="px-6 py-4 bg-gray-50 flex gap-3 border-t border-gray-100">
        <button @click="$emit('close')" class="btn btn-secondary flex-1">
          Hủy
        </button>
        <button @click="$emit('submit')" class="btn btn-primary flex-1">
          Lưu thay đổi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "Thông báo",
  },
});

defineEmits(["close", "submit"]);
</script>
