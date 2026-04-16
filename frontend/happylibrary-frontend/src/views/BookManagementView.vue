<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Quản lý Sách</h1>
        <p class="text-gray-600">Quản lý danh sách sách trong thư viện</p>
      </div>
      <button
        @click="openCreateModal"
        class="btn btn-primary flex items-center gap-2"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Thêm Sách
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="mb-6 space-y-4">
      <div class="flex gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm sách..."
          class="form-control flex-1"
        />
        <select v-model="selectedCategory" class="form-control w-48">
          <option value="">Tất cả danh mục</option>
          <option value="fiction">Văn học</option>
          <option value="science">Khoa học</option>
          <option value="history">Lịch sử</option>
        </select>
      </div>
    </div>

    <!-- Books Table/Grid -->
    <div class="card">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin">
          <svg
            class="w-8 h-8 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
      </div>

      <!-- Books list -->
      <div v-else class="overflow-x-auto">
        <table class="w-full table-auto">
          <thead>
            <tr class="border-b border-gray-200">
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                ISBN
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Tên sách
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Tác giả
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Nhà xuất bản
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Số lượng
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="book in books"
              :key="book.id"
              class="border-b border-gray-200 hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm text-gray-700">{{ book.isbn }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ book.title }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ book.author }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ book.publisher }}
              </td>
              <td class="px-4 py-3 text-sm">
                <AppBadge
                  :variant="book.quantity > 0 ? 'success' : 'danger'"
                  :text="`${book.quantity} cuốn`"
                />
              </td>
              <td class="px-4 py-3 space-x-2">
                <button
                  @click="editBook(book)"
                  class="btn btn-secondary text-xs"
                >
                  Sửa
                </button>
                <button
                  @click="deleteBook(book.id)"
                  class="btn btn-danger text-xs"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
        <div v-if="books.length === 0" class="py-8 text-center text-gray-500">
          Không tìm thấy sách nào
        </div>
      </div>
    </div>

    <!-- Book Form Modal -->
    <BookFormModal
      v-if="showModal"
      :book="editingBook"
      @close="closeModal"
      @save="saveBook"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useBookStore } from "@/stores/book.store";
import BookFormModal from "@/components/books/BookFormModal.vue";
import AppBadge from "@/components/common/AppBadge.vue";

const bookStore = useBookStore();
const searchQuery = ref("");
const selectedCategory = ref("");
const loading = ref(false);
const showModal = ref(false);
const editingBook = ref(null);

const books = computed(() => {
  let result = bookStore.books;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query),
    );
  }

  if (selectedCategory.value) {
    result = result.filter((book) => book.category === selectedCategory.value);
  }

  return result;
});

onMounted(async () => {
  loading.value = true;
  try {
    await bookStore.fetchBooks();
  } finally {
    loading.value = false;
  }
});

const openCreateModal = () => {
  editingBook.value = null;
  showModal.value = true;
};

const editBook = (book) => {
  editingBook.value = { ...book };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingBook.value = null;
};

const saveBook = async (bookData) => {
  try {
    if (editingBook.value?.id) {
      await bookStore.updateBook(editingBook.value.id, bookData);
    } else {
      await bookStore.createBook(bookData);
    }
    closeModal();
  } catch (error) {
    console.error("Failed to save book:", error);
  }
};

const deleteBook = async (bookId) => {
  if (confirm("Bạn chắc chắn muốn xóa sách này?")) {
    try {
      await bookStore.deleteBook(bookId);
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  }
};
</script>

<style scoped>
/* Component-specific styles */
</style>
