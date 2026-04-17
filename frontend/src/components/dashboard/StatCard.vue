<template>
  <div class="card">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600">{{ label }}</p>
        <p class="text-3xl font-bold text-gray-900">{{ value }}</p>
      </div>
      <div
        class="w-12 h-12 rounded-lg flex items-center justify-center"
        :class="iconBgClass"
      >
        <svg
          class="w-6 h-6"
          :class="iconColorClass"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="iconPath"
          />
        </svg>
      </div>
    </div>
    <p v-if="trend" class="text-sm mt-2" :class="trendColorClass">
      {{ trend > 0 ? "↑" : "↓" }} {{ Math.abs(trend) }}% từ tháng trước
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label: String,
  value: [String, Number],
  trend: Number, // positive = up, negative = down
  variant: {
    type: String,
    default: "primary",
    validator: (v) => ["primary", "success", "danger", "warning"].includes(v),
  },
  iconPath: String,
});

const colorConfig = {
  primary: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
    trend: "text-blue-600",
  },
  success: {
    bg: "bg-success-100",
    icon: "text-success-600",
    trend: "text-success-600",
  },
  danger: {
    bg: "bg-danger-100",
    icon: "text-danger-600",
    trend: "text-danger-600",
  },
  warning: {
    bg: "bg-yellow-100",
    icon: "text-yellow-600",
    trend: "text-yellow-600",
  },
};

const iconBgClass = computed(
  () => colorConfig[props.variant]?.bg || colorConfig.primary.bg,
);
const iconColorClass = computed(
  () => colorConfig[props.variant]?.icon || colorConfig.primary.icon,
);
const trendColorClass = computed(
  () => colorConfig[props.variant]?.trend || colorConfig.primary.trend,
);
</script>

<style scoped>
/* Component-specific styles */
</style>
