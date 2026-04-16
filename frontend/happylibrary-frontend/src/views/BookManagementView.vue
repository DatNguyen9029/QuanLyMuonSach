<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Quản lý Sách</h1>
        <p class="text-gray-600">
          {{
            authStore.isAdmin
              ? "Quản lý danh sách sách trong thư viện"
              : "Xem danh sách sách hiện có trong thư viện"
          }}
        </p>
      </div>
      <button
        v-if="authStore.isAdmin"
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
        <input
          v-model="selectedPublisher"
          type="text"
          placeholder="Lọc theo NXB..."
          class="form-control w-48"
        />
      </div>
      <div
        v-if="!authStore.isAdmin"
        class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
      >
        Tài khoản của bạn chỉ có quyền xem danh sách sách. Các thao tác thêm,
        sửa và xóa chỉ dành cho quản trị viên.
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
                Mã sách
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
                v-if="authStore.isAdmin"
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="book in books"
              :key="book._id"
              class="border-b border-gray-200 hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm text-gray-700">{{ book._id }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ book.tenSach }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ book.tacGia }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ book.tenNXB || "Chưa gán" }}
              </td>
              <td class="px-4 py-3 text-sm">
                <AppBadge
                  :variant="book.soLuongTienTai > 0 ? 'success' : 'danger'"
                  :text="`${book.soLuongTienTai} cuốn`"
                />
              </td>
              <td v-if="authStore.isAdmin" class="px-4 py-3 space-x-2">
                <button
                  @click="editBook(book)"
                  class="btn btn-secondary text-xs"
                >
                  Sửa
                </button>
                <button
                  @click="deleteBook(book._id)"
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
import { useAuthStore } from "@/stores/auth.store";
import BookFormModal from "@/components/books/BookFormModal.vue";
import AppBadge from "@/components/common/AppBadge.vue";

const authStore = useAuthStore();
const bookStore = useBookStore();
const searchQuery = ref("");
const selectedPublisher = ref("");
const loading = ref(false);
const showModal = ref(false);
const editingBook = ref(null);

const books = computed(() => {
  let result = bookStore.books;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (book) =>
        book.tenSach.toLowerCase().includes(query) ||
        book.tacGia.toLowerCase().includes(query),
    );
  }

  if (selectedPublisher.value) {
    const publisherQuery = selectedPublisher.value.toLowerCase();
    result = result.filter((book) =>
      (book.tenNXB || "").toLowerCase().includes(publisherQuery),
    );
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
  if (!authStore.isAdmin) return;
  editingBook.value = null;
  showModal.value = true;
};

const editBook = (book) => {
  if (!authStore.isAdmin) return;
  editingBook.value = { ...book };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingBook.value = null;
};

const saveBook = async (bookData) => {
  if (!authStore.isAdmin) return;
  try {
    if (editingBook.value?._id) {
      await bookStore.updateBook(editingBook.value._id, bookData);
    } else {
      await bookStore.createBook(bookData);
    }
    closeModal();
  } catch (error) {
    console.error("Failed to save book:", error);
  }
};

const deleteBook = async (bookId) => {
  if (!authStore.isAdmin) return;
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

export default { name: "Books" }
