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
          <input
            v-model.number="form.donGia"
            type="number"
            min="0"
            class="form-control"
            placeholder="50000"
          />
        </div>
      </div>

      <div>
        <label class="form-label">Nhà xuất bản</label>
        <select v-model="form.nxb" class="form-control">
          <option value="">Chọn nhà xuất bản</option>
          <option
            v-for="publisher in publishers"
            :key="publisher._id"
            :value="publisher._id"
          >
            {{ publisher.tenNXB }}
          </option>
        </select>
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
import AppModel from "@/components/common/AppModel.vue";

const props = defineProps({
  book: Object,
});

const emit = defineEmits(["close", "save"]);
const publishers = ref([]);

const form = ref({
  tenSach: "",
  tacGia: "",
  donGia: 0,
  nxb: "",
  namXuatBan: new Date().getFullYear(),
  soLuongTienTai: 0,
  hinhAnh: "",
});

onMounted(async () => {
  const { data } = await api.get("/publishers");
  publishers.value = data.data || [];

  if (props.book) {
    form.value = {
      tenSach: props.book.tenSach || "",
      tacGia: props.book.tacGia || "",
      donGia: props.book.donGia || 0,
      nxb: props.book.nxb || "",
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
/* Component-specific styles */
</style>
