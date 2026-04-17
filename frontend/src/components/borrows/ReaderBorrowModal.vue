<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
        <div class="modal-content">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">Tạo yêu cầu mượn sách</h2>
            <button @click="$emit('close')" class="modal-close">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <!-- Thông tin sách -->
              <div class="form-group">
                <label class="form-label required">Sách mượn</label>
                <div class="book-info-card">
                  <div class="book-info-content">
                    <h3 class="book-title">{{ book.tenSach }}</h3>
                    <p class="book-author">Tác giả: {{ book.tacGia }}</p>
                    <p class="book-publisher" v-if="book.tenNXB">
                      NXB: {{ book.tenNXB }}
                    </p>
                    <div class="book-stock">
                      <span
                        class="stock-badge"
                        :class="{
                          'stock-badge--available': book.soLuongTienTai > 0,
                          'stock-badge--unavailable': book.soLuongTienTai <= 0,
                        }"
                      >
                        {{
                          book.soLuongTienTai > 0
                            ? `Còn ${book.soLuongTienTai} cuốn`
                            : "Hết sách"
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ngày hẹn trả -->
              <div class="form-group">
                <label for="dueDate" class="form-label required">
                  Ngày hẹn trả
                </label>
                <input
                  id="dueDate"
                  v-model="formData.ngayHenTra"
                  type="date"
                  :min="minDueDate"
                  :max="maxDueDate"
                  class="form-input"
                  required
                />
                <p class="form-hint">
                  Thời gian mượn tối đa: 30 ngày kể từ hôm nay
                </p>
              </div>

              <!-- Ghi chú -->
              <div class="form-group">
                <label for="note" class="form-label">Ghi chú (tùy chọn)</label>
                <textarea
                  id="note"
                  v-model="formData.ghiChu"
                  class="form-textarea"
                  rows="3"
                  placeholder="Nhập ghi chú nếu có..."
                  maxlength="500"
                ></textarea>
                <p class="form-hint">
                  {{ formData.ghiChu.length }}/500 ký tự
                </p>
              </div>

              <!-- Alert nếu sách hết -->
              <div v-if="book.soLuongTienTai <= 0" class="alert alert-warning">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <span>
                  Sách hiện đã hết. Bạn vẫn có thể gửi yêu cầu, thư viện sẽ xử
                  lý khi có sách trả lại.
                </span>
              </div>

              <!-- Action buttons -->
              <div class="modal-actions">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="btn btn-secondary"
                  :disabled="isSubmitting"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="isSubmitting || !isFormValid"
                >
                  <span v-if="isSubmitting" class="btn-loading">
                    <svg class="animate-spin" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                        fill="none"
                        opacity="0.25"
                      />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Đang gửi...
                  </span>
                  <span v-else>Gửi yêu cầu mượn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  book: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "submit"]);

const isSubmitting = ref(false);
const formData = ref({
  ngayHenTra: "",
  ghiChu: "",
});

// Tính toán ngày min/max cho input date
const today = new Date();
const minDueDate = computed(() => {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
});

const maxDueDate = computed(() => {
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  return maxDate.toISOString().split("T")[0];
});

const isFormValid = computed(() => {
  return formData.value.ngayHenTra !== "";
});

// Reset form khi modal đóng
watch(
  () => props.show,
  (newVal) => {
    if (!newVal) {
      resetForm();
    } else {
      // Set default due date (7 days from now)
      const defaultDueDate = new Date(today);
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      formData.value.ngayHenTra = defaultDueDate.toISOString().split("T")[0];
    }
  }
);

const resetForm = () => {
  formData.value = {
    ngayHenTra: "",
    ghiChu: "",
  };
  isSubmitting.value = false;
};

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    await emit("submit", {
      bookId: props.book._id,
      ngayHenTra: formData.value.ngayHenTra,
      ghiChu: formData.value.ghiChu.trim(),
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* Modal backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Modal content */
.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

/* Modal header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #6b7280;
  transition: all 0.2s;
  border-radius: 0.5rem;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-close svg {
  width: 1.5rem;
  height: 1.5rem;
}

/* Modal body */
.modal-body {
  padding: 1.5rem;
}

/* Form groups */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: " *";
  color: #ef4444;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

/* Book info card */
.book-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0.75rem;
  padding: 1.25rem;
  color: white;
}

.book-info-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.book-info-content p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.book-stock {
  margin-top: 0.75rem;
}

.stock-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.stock-badge--available {
  background-color: rgba(34, 197, 94, 0.2);
  color: #dcfce7;
}

.stock-badge--unavailable {
  background-color: rgba(239, 68, 68, 0.2);
  color: #fee2e2;
}

/* Alert */
.alert {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.alert svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.alert-warning {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

/* Modal actions */
.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* Buttons */
.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-loading svg {
  width: 1rem;
  height: 1rem;
}

/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
