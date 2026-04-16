import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useBookStore = defineStore("book", () => {
  // State
  const books = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Computed
  const bookCount = computed(() => books.value.length);

  const normalizeBook = (book) => ({
    _id: book._id,
    tenSach: book.tenSach || "",
    tacGia: book.tacGia || "",
    nxb: book.nxb?._id || book.nxb || "",
    tenNXB: book.nxb?.tenNXB || "",
    namXuatBan: book.namXuatBan || "",
    soLuongTienTai: book.soLuongTienTai || 0,
    donGia: book.donGia || 0,
    hinhAnh: book.hinhAnh || "",
  });

  // Actions
  const fetchBooks = async (params = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.get("/books", { params });
      books.value = (data.data || []).map(normalizeBook);
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const createBook = async (bookData) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.post("/books", bookData);
      const createdBook = normalizeBook(data.data);
      books.value.unshift(createdBook);
      return createdBook;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateBook = async (bookId, bookData) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.put(`/books/${bookId}`, bookData);
      const updatedBook = normalizeBook(data.data);
      const index = books.value.findIndex((b) => b._id === bookId);
      if (index > -1) {
        books.value[index] = updatedBook;
      }
      return updatedBook;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteBook = async (bookId) => {
    isLoading.value = true;
    error.value = null;
    try {
      await api.delete(`/books/${bookId}`);
      books.value = books.value.filter((b) => b._id !== bookId);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    books,
    isLoading,
    error,
    bookCount,
    fetchBooks,
    createBook,
    updateBook,
    deleteBook,
  };
});
