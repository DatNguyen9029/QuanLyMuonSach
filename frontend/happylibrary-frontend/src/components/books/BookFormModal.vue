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
        <input
          v-model="form.hinhAnh"
          type="text"
          class="form-control"
          placeholder="https://example.com/book-cover.jpg"
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
  }
});

const handleSave = () => {
  if (!form.value.tenSach) {
    alert("Vui lòng nhập tên sách");
    return;
  }
  emit("save", form.value);
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
</style>
