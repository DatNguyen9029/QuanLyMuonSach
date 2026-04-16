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

  // Actions
  const fetchBooks = async (params = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.get("/books", { params });
      books.value = data.data || data;
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
      books.value.push(data);
      return data;
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
      const index = books.value.findIndex((b) => b.id === bookId);
      if (index > -1) {
        books.value[index] = data;
      }
      return data;
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
      books.value = books.value.filter((b) => b.id !== bookId);
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
