<template>
  <div class="card max-w-lg mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <button
        @click="$emit('close')"
        class="text-gray-500 hover:text-gray-700 text-xl font-bold"
      >
        ×
      </button>
    </div>

    <!-- Modal content -->
    <slot />

    <!-- Footer -->
    <div class="flex gap-3 mt-6 pt-4 border-t border-gray-200">
      <button @click="$emit('close')" class="btn btn-secondary flex-1">
        Hủy
      </button>
      <button @click="$emit('submit')" class="btn btn-primary flex-1">
        Lưu
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "Dialog",
  },
});

defineEmits(["close", "submit"]);
</script>

<style scoped>
/* Component-specific styles */
</style>
