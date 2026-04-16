<template>
  <AppModel title="Thêm/Sửa Sách" @close="$emit('close')" @submit="handleSave">
    <div class="space-y-4">
      <div>
        <label class="form-label">Tiêu đề</label>
        <input
          v-model="form.title"
          type="text"
          class="form-control"
          placeholder="Nhập tiêu đề sách"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Tác giả</label>
          <input
            v-model="form.author"
            type="text"
            class="form-control"
            placeholder="Tác giả"
          />
        </div>
        <div>
          <label class="form-label">ISBN</label>
          <input
            v-model="form.isbn"
            type="text"
            class="form-control"
            placeholder="ISBN"
          />
        </div>
      </div>

      <div>
        <label class="form-label">Nhà xuất bản</label>
        <input
          v-model="form.publisher"
          type="text"
          class="form-control"
          placeholder="Nhà xuất bản"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Năm xuất bản</label>
          <input
            v-model="form.year"
            type="number"
            class="form-control"
            placeholder="Năm"
          />
        </div>
        <div>
          <label class="form-label">Số lượng</label>
          <input
            v-model="form.quantity"
            type="number"
            class="form-control"
            placeholder="Số lượng"
          />
        </div>
      </div>

      <div>
        <label class="form-label">Danh mục</label>
        <select v-model="form.category" class="form-control">
          <option value="">Chọn danh mục</option>
          <option value="fiction">Văn học</option>
          <option value="science">Khoa học</option>
          <option value="history">Lịch sử</option>
        </select>
      </div>

      <div>
        <label class="form-label">Mô tả</label>
        <textarea
          v-model="form.description"
          class="form-control"
          rows="3"
          placeholder="Mô tả sách"
        ></textarea>
      </div>
    </div>
  </AppModel>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AppModel from "@/components/common/AppModel.vue";

const props = defineProps({
  book: Object,
});

const emit = defineEmits(["close", "save"]);

const form = ref({
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  year: new Date().getFullYear(),
  quantity: 0,
  category: "",
  description: "",
});

onMounted(() => {
  if (props.book) {
    form.value = { ...props.book };
  }
});

const handleSave = () => {
  if (!form.value.title) {
    alert("Vui lòng nhập tiêu đề sách");
    return;
  }
  emit("save", form.value);
};
</script>

<style scoped>
/* Component-specific styles */
</style>
