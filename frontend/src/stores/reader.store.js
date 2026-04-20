import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useReaderStore = defineStore("reader", () => {
  const normalizeReader = (reader) => ({
    _id: reader._id,
    username: reader.username || "",
    email: reader.email || "",
    hoTen: reader.hoTen || "",
    dienThoai: reader.dienThoai || "",
    ngaySinh: reader.ngaySinh || "",
    phai: reader.phai || "",
    diaChi: reader.diaChi || "",
    role: reader.role || "user",
    isBlacklisted: Boolean(reader.isBlacklisted),
    blacklistReason: reader.blacklistReason || "",
    blacklistedAt: reader.blacklistedAt || null,
    createdAt: reader.createdAt,
  });

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
      readers.value = (data.data || []).map(normalizeReader);
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
      const createdReader = normalizeReader(data.data);
      readers.value.unshift(createdReader);
      return createdReader;
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
      const updatedReader = normalizeReader(data.data);
      const index = readers.value.findIndex((r) => r._id === readerId);
      if (index > -1) {
        readers.value[index] = updatedReader;
      }
      return updatedReader;
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
      readers.value = readers.value.filter((r) => r._id !== readerId);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setBlacklistStatus = async (
    readerId,
    { isBlacklisted, blacklistReason = "" } = {},
  ) => {
    const payload = {
      isBlacklisted: Boolean(isBlacklisted),
      blacklistReason: String(blacklistReason || "").trim(),
    };
    return updateReader(readerId, payload);
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
    setBlacklistStatus,
  };
});
