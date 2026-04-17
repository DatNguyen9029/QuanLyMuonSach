<template>
  <AppModal
    title="Tính Tiền Phạt"
    size="md"
    submit-text="Xác nhận phạt"
    cancel-text="Hủy"
    @close="$emit('close')"
    @submit="handleConfirm"
  >
    <div class="space-y-4">
      <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-sm text-yellow-800">
          <strong>Sách:</strong> {{ borrow?.book?.title || "-" }}
        </p>
        <p class="text-sm text-yellow-800 mt-1">
          <strong>Độc giả:</strong> {{ borrow?.reader?.name || "-" }}
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
            {{ formatDate(effectiveReturnDate) }}
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
          Mức phạt: {{ Number(finePerDay).toLocaleString("vi-VN") }}đ / ngày
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
        />
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed } from "vue";
import AppModal from "@/components/common/AppModal.vue";

const props = defineProps({
  borrow: {
    type: Object,
    default: null,
  },
  finePerDay: {
    type: Number,
    default: 10000,
  },
});

const emit = defineEmits(["close", "confirm"]);

const notes = ref("");

const effectiveReturnDate = computed(() => {
  return props.borrow?.returnedDate || new Date();
});

const daysOverdue = computed(() => {
  if (!props.borrow?.dueDate) return 0;
  const dueDate = new Date(props.borrow.dueDate);
  const returnDate = new Date(effectiveReturnDate.value);
  const diff = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
});

const totalFine = computed(
  () => daysOverdue.value * Number(props.finePerDay || 0),
);

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("vi-VN");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));
}

function handleConfirm() {
  emit("confirm", {
    borrowId: props.borrow?._id || props.borrow?.id,
    fine: totalFine.value,
    daysOverdue: daysOverdue.value,
    notes: notes.value,
  });
}
</script>
