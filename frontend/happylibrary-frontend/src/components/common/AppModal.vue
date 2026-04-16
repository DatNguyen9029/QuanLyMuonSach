<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div
      :class="[
        'bg-white rounded-xl shadow-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200',
        sizeClass,
      ]"
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

      <div
        v-if="showFooter"
        class="px-6 py-4 bg-gray-50 flex gap-3 border-t border-gray-100"
      >
        <slot name="footer">
          <button @click="$emit('close')" class="btn btn-secondary flex-1">
            {{ cancelText }}
          </button>
          <button
            @click="$emit('submit')"
            :disabled="submitDisabled"
            class="btn btn-primary flex-1"
          >
            {{ submitText }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "Thông báo",
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg", "xl"].includes(value),
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
  submitText: {
    type: String,
    default: "Lưu thay đổi",
  },
  cancelText: {
    type: String,
    default: "Hủy",
  },
  submitDisabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close", "submit"]);

const sizeClass = computed(() => {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  return sizes[props.size] || sizes.md;
});
</script>
