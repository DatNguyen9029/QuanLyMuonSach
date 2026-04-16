<template>
  <AppModel title="Chi tiết Mượn Sách" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="form-label">Sách</label>
        <p class="form-control bg-gray-100 cursor-not-allowed">
          {{ borrow?.book?.title || "-" }}
        </p>
      </div>

      <div>
        <label class="form-label">Độc giả</label>
        <p class="form-control bg-gray-100 cursor-not-allowed">
          {{ borrow?.reader?.name || "-" }}
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

      <div class="grid grid-cols-2 gap-4" v-if="borrow?.returnedDate">
        <div>
          <label class="form-label">Ngày trả</label>
          <p class="form-control bg-gray-100 cursor-not-allowed">
            {{ formatDate(borrow?.returnedDate) }}
          </p>
        </div>
        <div>
          <label class="form-label">Trạng thái</label>
          <p class="form-control bg-gray-100 cursor-not-allowed">
            {{ borrow?.statusLabel || borrow?.displayStatus || "-" }}
          </p>
        </div>
      </div>

      <div v-else>
        <label class="form-label">Trạng thái</label>
        <p class="form-control bg-gray-100 cursor-not-allowed">
          {{ borrow?.statusLabel || borrow?.displayStatus || "-" }}
        </p>
      </div>

      <div v-if="borrow?.rejectReason">
        <label class="form-label">Lý do từ chối</label>
        <p class="form-control bg-red-50 text-red-700">
          {{ borrow.rejectReason }}
        </p>
      </div>

      <div v-if="borrow?.fineAmount > 0">
        <label class="form-label">Tiền phạt</label>
        <p class="form-control bg-yellow-50 text-yellow-800">
          {{ formatCurrency(borrow.fineAmount) }}
        </p>
      </div>

      <div>
        <label class="form-label">Ghi chú</label>
        <textarea
          :value="borrow?.note || ''"
          readonly
          class="form-control bg-gray-100"
          rows="3"
        />
      </div>

      <!-- [ROLE CHECK] Chỉ Admin mới thấy khu vực xử lý -->
      <div v-if="canManage" class="pt-2 border-t border-gray-200 space-y-2">
        <div class="text-sm font-semibold text-gray-700">Thao tác Admin</div>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="borrow?.backendStatus === 'ChoDuyet'"
            class="btn btn-primary"
            @click="$emit('approve', borrow)"
          >
            Duyệt phiếu
          </button>

          <button
            v-if="borrow?.backendStatus === 'ChoDuyet'"
            class="btn btn-danger"
            @click="$emit('reject', borrow)"
          >
            Từ chối
          </button>

          <button
            v-if="
              borrow?.backendStatus === 'DangMuon' ||
              borrow?.status === 'overdue'
            "
            class="btn btn-success"
            @click="$emit('return', borrow)"
          >
            Xác nhận trả
          </button>

          <button
            v-if="
              borrow?.backendStatus === 'DangMuon' ||
              borrow?.status === 'overdue'
            "
            class="btn btn-warning"
            @click="$emit('lost', borrow)"
          >
            Báo mất sách
          </button>

          <button
            v-if="borrow?.backendStatus === 'DangMuon'"
            class="btn btn-outline"
            @click="$emit('extend', borrow)"
          >
            Gia hạn
          </button>

          <button
            v-if="
              borrow?.backendStatus === 'DangMuon' ||
              borrow?.status === 'overdue'
            "
            class="btn btn-outline"
            @click="$emit('fine', borrow)"
          >
            Tính phạt
          </button>
        </div>
      </div>
    </div>
  </AppModel>
</template>

<script setup>
import AppModel from "@/components/common/AppModel.vue";

defineProps({
  borrow: {
    type: Object,
    default: null,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close", "approve", "reject", "return", "lost", "extend", "fine"]);

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
</script>
