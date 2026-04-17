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
      <div class="flex gap-2">
        <button
          v-if="!authStore.isAdmin"
          @click="showBorrowHelp = !showBorrowHelp"
          class="btn btn-secondary flex items-center gap-2"
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Hướng dẫn
        </button>
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

      <!-- Help box for readers -->
      <div
        v-if="!authStore.isAdmin && showBorrowHelp"
        class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
      >
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p class="font-semibold mb-1">Hướng dẫn mượn sách:</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>Nhấn vào nút "Tạo phiếu mượn" bên cạnh sách bạn muốn mượn</li>
              <li>Chọn ngày hẹn trả (tối đa 30 ngày)</li>
              <li>Gửi yêu cầu và chờ admin duyệt</li>
              <li>
                Bạn sẽ nhận thông báo khi yêu cầu được duyệt hoặc từ chối
              </li>
            </ol>
          </div>
        </div>
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
              <td class="px-4 py-3 space-x-2">
                <!-- Admin actions -->
                <template v-if="authStore.isAdmin">
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
                </template>

                <!-- Reader actions -->
                <template v-else>
                  <button
                    @click="openBorrowModal(book)"
                    class="btn btn-primary text-xs"
                    :disabled="book.soLuongTienTai <= 0"
                  >
                    <svg
                      class="w-4 h-4 inline-block mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Tạo phiếu mượn
                  </button>
                </template>
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

    <!-- Reader Borrow Modal -->
    <ReaderBorrowModal
      v-if="showBorrowModal"
      :show="showBorrowModal"
      :book="selectedBook"
      @close="closeBorrowModal"
      @submit="handleBorrowSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useBookStore } from "@/stores/book.store";
import { useAuthStore } from "@/stores/auth.store";
import { useBorrowStore } from "@/stores/borrow.store";
import BookFormModal from "@/components/books/BookFormModal.vue";
import ReaderBorrowModal from "@/components/borrows/ReaderBorrowModal.vue";
import AppBadge from "@/components/common/AppBadge.vue";

const router = useRouter();
const authStore = useAuthStore();
const bookStore = useBookStore();
const borrowStore = useBorrowStore();

const searchQuery = ref("");
const selectedPublisher = ref("");
const loading = ref(false);
const showModal = ref(false);
const editingBook = ref(null);

// Borrow modal state
const showBorrowModal = ref(false);
const showBorrowHelp = ref(false);
const selectedBook = ref(null);

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

// Borrow modal functions
const openBorrowModal = (book) => {
  selectedBook.value = book;
  showBorrowModal.value = true;
};

const closeBorrowModal = () => {
  showBorrowModal.value = false;
  selectedBook.value = null;
};

const handleBorrowSubmit = async (borrowData) => {
  try {
    await borrowStore.createBorrowRequest(borrowData);

    // Show success message
    alert(
      "Yêu cầu mượn sách đã được gửi thành công! Vui lòng chờ admin duyệt."
    );

    // Close modal
    closeBorrowModal();

    // Navigate to borrows page to see the request
    router.push("/borrows");
  } catch (error) {
    console.error("Failed to create borrow request:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Không thể tạo yêu cầu mượn sách. Vui lòng thử lại.";
    alert(errorMessage);
  }
};
</script>

<style scoped>
/* Component-specific styles */
</style>

export default { name: "Books" }
