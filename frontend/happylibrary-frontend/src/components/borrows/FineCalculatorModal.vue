<template>
  <AppModel
    title="Tính Tiền Phạt"
    @close="$emit('close')"
    @submit="handleConfirm"
  >
    <div class="space-y-4">
      <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800">
          <strong>Sách:</strong> {{ borrow?.book?.title }}
        </p>
        <p class="text-sm text-yellow-800 mt-1">
          <strong>Độc giả:</strong> {{ borrow?.reader?.name }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Ngày hết hạn</label>
          <p class="text-sm text-gray-700">{{ formatDate(borrow?.dueDate) }}</p>
        </div>
        <div>
          <label class="form-label">Ngày trả</label>
          <p class="text-sm text-gray-700">
            {{ formatDate(borrow?.returnDate) }}
          </p>
        </div>
      </div>

      <div>
        <label class="form-label">Số ngày trễ</label>
        <p class="text-2xl font-bold text-danger-600">{{ daysOverdue }}</p>
      </div>

      <div class="border-t border-gray-200 pt-4">
        <label class="form-label">Tính toán phạt</label>
        <p class="text-sm text-gray-600 mb-2">
          Mức phạt: {{ finePerDay.toLocaleString() }}đ / ngày
        </p>
        <p class="text-3xl font-bold text-danger-600">
          {{ formatCurrency(totalFine) }}
        </p>
      </div>

      <div>
        <label class="form-label">Ghi chú (tùy chọn)</label>
        <textarea
          v-model="notes"
          class="form-control"
          rows="2"
          placeholder="Bình luận về khoản phạt này"
        ></textarea>
      </div>
    </div>
  </AppModel>
</template>

<script setup>
import { ref, computed } from "vue";
import AppModel from "@/components/common/AppModel.vue";

const props = defineProps({
  borrow: Object,
  finePerDay: {
    type: Number,
    default: 5000, // 5k per day
  },
});

const emit = defineEmits(["close", "confirm"]);

const notes = ref("");

const daysOverdue = computed(() => {
  if (!props.borrow?.dueDate || !props.borrow?.returnDate) return 0;
  const dueDate = new Date(props.borrow.dueDate);
  const returnDate = new Date(props.borrow.returnDate);
  const days = Math.max(
    0,
    Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24)),
  );
  return days;
});

const totalFine = computed(() => daysOverdue.value * props.finePerDay);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("vi-VN");
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const handleConfirm = () => {
  emit("confirm", {
    borrowId: props.borrow?.id,
    fine: totalFine.value,
    notes: notes.value,
  });
};
</script>

<style scoped>
/* Component-specific styles */
</style>
