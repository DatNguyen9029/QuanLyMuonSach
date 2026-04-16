<template>
  <AppModel title="Chi tiết Mượn Sách" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="form-label">Sách</label>
        <p class="form-control bg-gray-100 cursor-not-allowed">
          {{ borrow?.book?.title }}
        </p>
      </div>

      <div>
        <label class="form-label">Độc giả</label>
        <p class="form-control bg-gray-100 cursor-not-allowed">
          {{ borrow?.reader?.name }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Ngày mượn</label>
          <p class="form-control bg-gray-100 cursor-not-allowed">
            {{ formatDate(borrow?.borrowDate) }}
          </p>
        </div>
        <div>
          <label class="form-label">Ngày hết hạn</label>
          <p class="form-control bg-gray-100 cursor-not-allowed">
            {{ formatDate(borrow?.dueDate) }}
          </p>
        </div>
      </div>

      <div v-if="borrow?.returnDate" class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Ngày trả</label>
          <p class="form-control bg-gray-100 cursor-not-allowed">
            {{ formatDate(borrow?.returnDate) }}
          </p>
        </div>
        <div>
          <label class="form-label">Trạng thái</label>
          <p class="form-control bg-gray-100 cursor-not-allowed">Đã trả</p>
        </div>
      </div>

      <div v-else>
        <label class="form-label">Trạng thái</label>
        <p class="form-control bg-yellow-50">Đang mượn</p>
      </div>

      <div v-if="borrow?.fine && borrow.fine > 0">
        <label class="form-label">Tiền phạt</label>
        <p class="form-control bg-danger-50 text-danger-800">
          {{ formatCurrency(borrow.fine) }}
        </p>
      </div>

      <div>
        <label class="form-label">Ghi chú</label>
        <textarea
          :value="borrow?.notes"
          readonly
          class="form-control bg-gray-100"
          rows="3"
        ></textarea>
      </div>
    </div>
  </AppModel>
</template>

<script setup>
const props = defineProps({
  borrow: Object,
});

defineEmits(["close"]);

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
</script>

<style scoped>
/* Component-specific styles */
</style>
