import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useReaderStore = defineStore("reader", () => {
  // State
  const readers = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Computed
  const readerCount = computed(() => readers.value.length);

  // Actions
  const fetchReaders = async (params = {}) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.get("/users", { params });
      readers.value = data.data || data;
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const createReader = async (readerData) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.post("/users", readerData);
      readers.value.push(data);
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateReader = async (readerId, readerData) => {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.put(`/users/${readerId}`, readerData);
      const index = readers.value.findIndex((r) => r.id === readerId);
      if (index > -1) {
        readers.value[index] = data;
      }
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteReader = async (readerId) => {
    isLoading.value = true;
    error.value = null;
    try {
      await api.delete(`/users/${readerId}`);
      readers.value = readers.value.filter((r) => r.id !== readerId);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    readers,
    isLoading,
    error,
    readerCount,
    fetchReaders,
    createReader,
    updateReader,
    deleteReader,
  };
});
