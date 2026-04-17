<template>
  <AppModel title="Thêm/Sửa Sách" @close="$emit('close')" @submit="handleSave">
    <div class="space-y-4">
      <div>
        <label class="form-label">Tên sách</label>
        <input
          v-model="form.tenSach"
          type="text"
          class="form-control"
          placeholder="Nhập tên sách"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Tác giả</label>
          <input
            v-model="form.tacGia"
            type="text"
            class="form-control"
            placeholder="Tác giả"
          />
        </div>
        <div>
          <label class="form-label">Đơn giá</label>
          <div class="relative">
            <input
              v-model.number="form.donGia"
              type="number"
              min="0"
              step="1000"
              class="form-control pr-16"
              placeholder="50000"
            />
            <span class="currency-suffix">VND</span>
          </div>
        </div>
      </div>

      <div>
        <label class="form-label">Nhà xuất bản</label>
        <input
          v-model="form.tenNXB"
          type="text"
          class="form-control"
          list="publisher-suggestions"
          placeholder="Nhập tên nhà xuất bản"
        />
        <datalist id="publisher-suggestions">
          <option
            v-for="publisher in publishers"
            :key="publisher._id"
            :value="publisher.tenNXB"
          >
            {{ publisher.maNXB }}
          </option>
        </datalist>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Năm xuất bản</label>
          <input
            v-model.number="form.namXuatBan"
            type="number"
            class="form-control"
            placeholder="Năm"
          />
        </div>
        <div>
          <label class="form-label">Số lượng</label>
          <input
            v-model.number="form.soLuongTienTai"
            type="number"
            min="0"
            class="form-control"
            placeholder="Số lượng"
          />
        </div>
      </div>

      <div>
        <label class="form-label">Ảnh bìa</label>
        <div class="space-y-3">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="form-control"
            @change="handleImageFileChange"
          />
          <p class="text-xs text-gray-500">
            Chọn ảnh từ thiết bị (tối đa 5MB), hoặc nhập URL bên dưới.
          </p>
          <div v-if="form.hinhAnh" class="cover-preview-wrapper">
            <img :src="form.hinhAnh" alt="Xem trước ảnh bìa" class="cover-preview" />
            <button type="button" class="btn btn-secondary text-xs" @click="clearImage">
              Xóa ảnh
            </button>
          </div>
        </div>
        <input
          v-model="imageUrlInput"
          type="text"
          class="form-control"
          placeholder="https://example.com/book-cover.jpg"
          @input="handleImageUrlInput"
        />
      </div>
    </div>
  </AppModel>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/services/api";
import AppModel from "@/components/common/AppModal.vue";

const props = defineProps({
  book: Object,
});

const emit = defineEmits(["close", "save"]);
const publishers = ref([]);
const fileInputRef = ref(null);
const imageUrlInput = ref("");

const form = ref({
  tenSach: "",
  tacGia: "",
  donGia: 0,
  tenNXB: "",
  namXuatBan: new Date().getFullYear(),
  soLuongTienTai: 0,
  hinhAnh: "",
});

onMounted(async () => {
  try {
    const { data } = await api.get("/publishers");
    publishers.value = data.data || [];
  } catch (error) {
    publishers.value = [];
  }

  if (props.book) {
    form.value = {
      tenSach: props.book.tenSach || "",
      tacGia: props.book.tacGia || "",
      donGia: props.book.donGia || 0,
      tenNXB: props.book.tenNXB || "",
      namXuatBan: props.book.namXuatBan || new Date().getFullYear(),
      soLuongTienTai: props.book.soLuongTienTai || 0,
      hinhAnh: props.book.hinhAnh || "",
    };

    // Nếu ảnh đang là URL thì hiển thị trong ô nhập URL; base64 thì chỉ preview.
    imageUrlInput.value = String(props.book.hinhAnh || "").startsWith("data:")
      ? ""
      : props.book.hinhAnh || "";
  }
});

const handleSave = () => {
  if (!form.value.tenSach) {
    alert("Vui lòng nhập tên sách");
    return;
  }
  emit("save", form.value);
};

const handleImageFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn file ảnh hợp lệ.");
    clearSelectedFile();
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("Ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
    clearSelectedFile();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    form.value.hinhAnh = typeof reader.result === "string" ? reader.result : "";
    imageUrlInput.value = "";
  };
  reader.onerror = () => {
    alert("Không thể đọc file ảnh. Vui lòng thử lại.");
    clearSelectedFile();
  };
  reader.readAsDataURL(file);
};

const handleImageUrlInput = () => {
  form.value.hinhAnh = imageUrlInput.value.trim();
  clearSelectedFile();
};

const clearSelectedFile = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const clearImage = () => {
  form.value.hinhAnh = "";
  imageUrlInput.value = "";
  clearSelectedFile();
};
</script>

<style scoped>
.currency-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  pointer-events: none;
}

.cover-preview-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-preview {
  width: 64px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
}
</style>
