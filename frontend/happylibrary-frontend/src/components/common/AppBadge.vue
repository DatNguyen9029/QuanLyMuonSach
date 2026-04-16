<template>
  <div
    class="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
    :class="variantClass"
  >
    {{ text }}
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "success", "danger", "warning", "info"].includes(value),
  },
});

const variants = {
  primary: "bg-primary-100 text-primary-800",
  success: "bg-success-100 text-success-800",
  danger: "bg-danger-100 text-danger-800",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-800",
};

const variantClass = computed(
  () => variants[props.variant] || variants.primary,
);
</script>

<style scoped>
/* Component-specific styles */
</style>
