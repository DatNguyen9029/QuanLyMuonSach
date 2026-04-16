import { defineStore } from "pinia";
import { computed, ref } from "vue";
import api from "@/services/api";

export const usePublisherStore = defineStore("publisher", () => {
  const publishers = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const publisherCount = computed(() => publishers.value.length);

  const normalizePublisher = (publisher) => ({
    _id: publisher._id,
    maNXB: publisher.maNXB || "",
    tenNXB: publisher.tenNXB || "",
    diaChi: publisher.diaChi || "",
    booksCount: publisher.booksCount || 0,
    createdAt: publisher.createdAt,
    updatedAt: publisher.updatedAt,
  });

  async function fetchPublishers() {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.get("/publishers");
      publishers.value = (data.data || []).map(normalizePublisher);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createPublisher(payload) {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.post("/publishers", payload);
      const normalized = normalizePublisher(data.data);
      publishers.value.unshift(normalized);
      return normalized;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updatePublisher(publisherId, payload) {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.put(`/publishers/${publisherId}`, payload);
      const normalized = normalizePublisher(data.data);
      const index = publishers.value.findIndex((item) => item._id === publisherId);
      if (index > -1) {
        publishers.value[index] = {
          ...publishers.value[index],
          ...normalized,
        };
      }
      return normalized;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePublisher(publisherId) {
    isLoading.value = true;
    error.value = null;
    try {
      await api.delete(`/publishers/${publisherId}`);
      publishers.value = publishers.value.filter((item) => item._id !== publisherId);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    publishers,
    isLoading,
    error,
    publisherCount,
    fetchPublishers,
    createPublisher,
    updatePublisher,
    deletePublisher,
  };
});
