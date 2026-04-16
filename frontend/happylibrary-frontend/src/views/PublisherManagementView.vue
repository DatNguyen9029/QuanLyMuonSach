<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Quản lý NXB</h1>
        <p class="text-gray-600">
          Quản lý danh mục nhà xuất bản theo thiết kế cơ sở dữ liệu
        </p>
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
        Thêm NXB
      </button>
    </div>

    <div class="mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Tìm theo mã NXB, tên NXB, địa chỉ..."
        class="form-control"
      />
    </div>

    <div class="card">
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

      <div v-else class="overflow-x-auto">
        <table class="w-full table-auto">
          <thead>
            <tr class="border-b border-gray-200">
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Mã NXB
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Tên NXB
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Địa chỉ
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-gray-600"
              >
                Số sách liên kết
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
              v-for="publisher in filteredPublishers"
              :key="publisher._id"
              class="border-b border-gray-200 hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm font-semibold text-gray-900">
                {{ publisher.maNXB }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ publisher.tenNXB }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ publisher.diaChi || "—" }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ publisher.booksCount }}
              </td>
              <td class="px-4 py-3 space-x-2">
                <button
                  @click="editPublisher(publisher)"
                  class="btn btn-secondary text-xs"
                >
                  Sửa
                </button>
                <button
                  @click="removePublisher(publisher)"
                  class="btn btn-danger text-xs"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="filteredPublishers.length === 0"
          class="py-8 text-center text-gray-500"
        >
          Không tìm thấy nhà xuất bản nào
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      >
        <AppModel
          :title="editingPublisher ? 'Cập nhật NXB' : 'Thêm NXB'"
          @close="closeModal"
          @submit="savePublisher"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Mã NXB</label>
                <input
                  v-model="form.maNXB"
                  class="form-control uppercase"
                  type="text"
                  placeholder="NXB001"
                />
              </div>
              <div>
                <label class="form-label">Tên NXB</label>
                <input
                  v-model="form.tenNXB"
                  class="form-control"
                  type="text"
                  placeholder="Nhà xuất bản Trẻ"
                />
              </div>
            </div>

            <div>
              <label class="form-label">Địa chỉ</label>
              <input
                v-model="form.diaChi"
                class="form-control"
                type="text"
                placeholder="Địa chỉ nhà xuất bản"
              />
            </div>

            <p class="text-xs text-gray-500">
              Bảng này được nối trực tiếp với `Sach.MaNXB` theo sơ đồ trong PDF.
              Không thể xóa NXB nếu đang có sách sử dụng.
            </p>
          </div>
        </AppModel>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import AppModel from "@/components/common/AppModal.vue";
import { usePublisherStore } from "@/stores/publisher.store";

const publisherStore = usePublisherStore();
const searchQuery = ref("");
const loading = ref(false);
const showModal = ref(false);
const editingPublisher = ref(null);
const form = ref(createDefaultForm());

function createDefaultForm() {
  return {
    maNXB: "",
    tenNXB: "",
    diaChi: "",
  };
}

const filteredPublishers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return publisherStore.publishers;

  return publisherStore.publishers.filter((publisher) =>
    [publisher.maNXB, publisher.tenNXB, publisher.diaChi]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query)),
  );
});

onMounted(async () => {
  loading.value = true;
  try {
    await publisherStore.fetchPublishers();
  } finally {
    loading.value = false;
  }
});

function openCreateModal() {
  editingPublisher.value = null;
  form.value = createDefaultForm();
  showModal.value = true;
}

function editPublisher(publisher) {
  editingPublisher.value = publisher;
  form.value = {
    maNXB: publisher.maNXB || "",
    tenNXB: publisher.tenNXB || "",
    diaChi: publisher.diaChi || "",
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingPublisher.value = null;
  form.value = createDefaultForm();
}

async function savePublisher() {
  if (!form.value.tenNXB.trim()) {
    alert("Vui lòng nhập tên nhà xuất bản.");
    return;
  }

  try {
    if (editingPublisher.value?._id) {
      await publisherStore.updatePublisher(
        editingPublisher.value._id,
        form.value,
      );
    } else {
      await publisherStore.createPublisher(form.value);
    }
    await publisherStore.fetchPublishers();
    closeModal();
  } catch (error) {
    alert(error.message || "Không thể lưu nhà xuất bản.");
  }
}

async function removePublisher(publisher) {
  const confirmed = confirm(
    `Bạn có chắc muốn xóa nhà xuất bản "${publisher.tenNXB}" không?`,
  );
  if (!confirmed) return;

  try {
    await publisherStore.deletePublisher(publisher._id);
  } catch (error) {
    alert(error.message || "Không thể xóa nhà xuất bản.");
  }
}
</script>

export default { name: "Publishers" }
