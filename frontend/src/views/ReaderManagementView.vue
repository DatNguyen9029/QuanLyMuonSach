<template>
  <div class="reader-page container mx-auto px-4 py-6">
    <section class="hero">
      <div>
        <h1 class="hero__title">Quản lý Độc giả</h1>
        <p class="hero__subtitle">Theo dõi tài khoản, vai trò và trạng thái blacklist</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary hero__cta">
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
        Thêm Độc giả
      </button>
    </section>

    <section class="stats-grid">
      <article class="stat-card stat-card--blue">
        <p class="stat-card__label">Tổng tài khoản</p>
        <p class="stat-card__value">{{ totalReaders }}</p>
      </article>
      <article class="stat-card stat-card--indigo">
        <p class="stat-card__label">Độc giả</p>
        <p class="stat-card__value">{{ userCount }}</p>
      </article>
      <article class="stat-card stat-card--amber">
        <p class="stat-card__label">Admin</p>
        <p class="stat-card__value">{{ adminCount }}</p>
      </article>
      <article class="stat-card stat-card--rose">
        <p class="stat-card__label">Đang blacklist</p>
        <p class="stat-card__value">{{ blacklistCount }}</p>
      </article>
    </section>

    <section class="toolbar card">
      <div class="toolbar__search">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm theo họ tên, username, email, số điện thoại..."
          class="form-control"
        />
      </div>
      <select v-model="selectedRole" class="form-control toolbar__select">
        <option value="">Tất cả vai trò</option>
        <option value="user">Độc giả</option>
        <option value="admin">Admin</option>
      </select>
    </section>

    <section class="card table-shell">
      <div v-if="loading" class="loading-wrap">
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

      <div v-else-if="filteredReaders.length === 0" class="empty-state">
        <p class="empty-state__title">Không tìm thấy độc giả phù hợp</p>
        <p class="empty-state__subtitle">Hãy thử thay đổi từ khóa hoặc bộ lọc vai trò.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full table-auto reader-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Username</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Vai trò</th>
              <th>Blacklist</th>
              <th>Ngày tham gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="reader in filteredReaders"
              :key="reader._id"
              :class="{ 'row--blacklisted': reader.isBlacklisted }"
            >
              <td class="mono">{{ shortId(reader._id) }}</td>
              <td>
                <p class="font-semibold text-gray-900">{{ reader.hoTen }}</p>
              </td>
              <td>{{ reader.username }}</td>
              <td>{{ reader.email }}</td>
              <td>{{ reader.dienThoai || "—" }}</td>
              <td>
                <span
                  class="badge"
                  :class="
                    reader.role === 'admin'
                      ? 'badge--amber'
                      : 'badge--blue'
                  "
                >
                  {{ reader.role === "admin" ? "Admin" : "Độc giả" }}
                </span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="
                    reader.isBlacklisted
                      ? 'badge--red'
                      : 'badge--green'
                  "
                >
                  {{ reader.isBlacklisted ? "Đang blacklist" : "Bình thường" }}
                </span>
                <p
                  v-if="reader.isBlacklisted && reader.blacklistReason"
                  class="blacklist-reason"
                >
                  {{ reader.blacklistReason }}
                </p>
              </td>
              <td>{{ formatDate(reader.createdAt) }}</td>
              <td>
                <div class="actions">
                  <button
                    v-if="reader.role === 'user' && !reader.isBlacklisted"
                    @click="addToBlacklist(reader)"
                    class="btn btn-warning text-xs"
                  >
                    Thêm blacklist
                  </button>
                  <button
                    v-if="reader.role === 'user' && reader.isBlacklisted"
                    @click="removeFromBlacklist(reader)"
                    class="btn btn-outline text-xs"
                  >
                    Gỡ blacklist
                  </button>
                  <button
                    @click="editReader(reader)"
                    class="btn btn-secondary text-xs"
                  >
                    Sửa
                  </button>
                  <button
                    @click="removeReader(reader._id)"
                    class="btn btn-danger text-xs"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      >
        <AppModel
          :title="editingReader ? 'Cập nhật độc giả' : 'Thêm độc giả'"
          @close="closeModal"
          @submit="saveReader"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Họ tên</label>
                <input v-model="form.hoTen" class="form-control" type="text" />
              </div>
              <div>
                <label class="form-label">Username</label>
                <input
                  v-model="form.username"
                  class="form-control"
                  type="text"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Email</label>
                <input v-model="form.email" class="form-control" type="email" />
              </div>
              <div>
                <label class="form-label">Số điện thoại</label>
                <input
                  v-model="form.dienThoai"
                  class="form-control"
                  type="text"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Ngày sinh</label>
                <input
                  v-model="form.ngaySinh"
                  class="form-control"
                  type="date"
                />
              </div>
              <div>
                <label class="form-label">Giới tính</label>
                <select v-model="form.phai" class="form-control">
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">Địa chỉ</label>
              <input v-model="form.diaChi" class="form-control" type="text" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Vai trò</label>
                <select v-model="form.role" class="form-control">
                  <option value="user">Độc giả</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label class="form-label">
                  {{ editingReader ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu" }}
                </label>
                <input
                  v-model="form.password"
                  class="form-control"
                  type="password"
                />
              </div>
            </div>
          </div>
        </AppModel>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useReaderStore } from "@/stores/reader.store";
import AppModel from "@/components/common/AppModal.vue";

const readerStore = useReaderStore();
const searchQuery = ref("");
const selectedRole = ref("");
const loading = ref(false);
const showModal = ref(false);
const editingReader = ref(null);
const form = ref(createDefaultForm());

function createDefaultForm() {
  return {
    username: "",
    email: "",
    password: "",
    hoTen: "",
    dienThoai: "",
    ngaySinh: "",
    phai: "",
    diaChi: "",
    role: "user",
  };
}

onMounted(async () => {
  loading.value = true;
  try {
    await readerStore.fetchReaders();
  } finally {
    loading.value = false;
  }
});

const filteredReaders = computed(() => {
  let result = readerStore.readers;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (reader) =>
        reader.hoTen.toLowerCase().includes(query) ||
        reader.username.toLowerCase().includes(query) ||
        reader.email.toLowerCase().includes(query) ||
        (reader.dienThoai || "").includes(query),
    );
  }

  if (selectedRole.value) {
    result = result.filter((reader) => reader.role === selectedRole.value);
  }

  return result;
});

const totalReaders = computed(() => readerStore.readers.length);
const userCount = computed(
  () => readerStore.readers.filter((reader) => reader.role === "user").length,
);
const adminCount = computed(
  () => readerStore.readers.filter((reader) => reader.role === "admin").length,
);
const blacklistCount = computed(
  () =>
    readerStore.readers.filter((reader) => Boolean(reader.isBlacklisted))
      .length,
);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "—";

const shortId = (id) => (id ? String(id).slice(-8).toUpperCase() : "—");

const openCreateModal = () => {
  editingReader.value = null;
  form.value = createDefaultForm();
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingReader.value = null;
  form.value = createDefaultForm();
};

const editReader = (reader) => {
  editingReader.value = reader;
  form.value = {
    username: reader.username,
    email: reader.email,
    password: "",
    hoTen: reader.hoTen,
    dienThoai: reader.dienThoai || "",
    ngaySinh: reader.ngaySinh ? reader.ngaySinh.slice(0, 10) : "",
    phai: reader.phai || "",
    diaChi: reader.diaChi || "",
    role: reader.role || "user",
  };
  showModal.value = true;
};

const saveReader = async () => {
  const payload = { ...form.value };

  if (!payload.password) {
    delete payload.password;
  }

  try {
    if (editingReader.value?._id) {
      await readerStore.updateReader(editingReader.value._id, payload);
    } else {
      await readerStore.createReader(payload);
    }
    closeModal();
  } catch (error) {
    alert(error.message || "Không thể lưu độc giả");
  }
};

const removeReader = async (readerId) => {
  if (!confirm("Bạn chắc chắn muốn xóa độc giả này?")) return;

  try {
    await readerStore.deleteReader(readerId);
  } catch (error) {
    alert(error.message || "Không thể xóa độc giả");
  }
};

const addToBlacklist = async (reader) => {
  const reason = prompt(
    `Nhập lý do blacklist cho "${reader.hoTen}" (có thể để trống):`,
    reader.blacklistReason || "",
  );
  if (reason === null) return;

  try {
    await readerStore.setBlacklistStatus(reader._id, {
      isBlacklisted: true,
      blacklistReason: reason,
    });
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        error.message ||
        "Không thể blacklist độc giả",
    );
  }
};

const removeFromBlacklist = async (reader) => {
  if (!confirm(`Gỡ "${reader.hoTen}" khỏi blacklist?`)) return;

  try {
    await readerStore.setBlacklistStatus(reader._id, {
      isBlacklisted: false,
      blacklistReason: "",
    });
  } catch (error) {
    alert(
      error?.response?.data?.message ||
        error.message ||
        "Không thể gỡ blacklist",
    );
  }
};
</script>

<style scoped>
.reader-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero {
  border: 1px solid #e7e5e4;
  border-radius: 18px;
  padding: 18px 20px;
  background: linear-gradient(135deg, #fff8e8 0%, #f8fafc 55%, #eef2ff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero__title {
  font-size: 1.7rem;
  line-height: 1.2;
  font-weight: 800;
  color: #111827;
}

.hero__subtitle {
  margin-top: 4px;
  color: #4b5563;
}

.hero__cta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 12px 14px;
  background: #fff;
}

.stat-card__label {
  font-size: 0.82rem;
  color: #6b7280;
}

.stat-card__value {
  margin-top: 3px;
  font-size: 1.45rem;
  font-weight: 800;
  color: #111827;
}

.stat-card--blue {
  background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%);
}

.stat-card--indigo {
  background: linear-gradient(180deg, #eef2ff 0%, #ffffff 100%);
}

.stat-card--amber {
  background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%);
}

.stat-card--rose {
  background: linear-gradient(180deg, #fff1f2 0%, #ffffff 100%);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.toolbar__search {
  flex: 1;
  position: relative;
}

.toolbar__search .search-icon {
  width: 18px !important;
  height: 18px !important;
  min-width: 18px;
  min-height: 18px;
  max-width: 18px;
  max-height: 18px;
  display: block;
  color: #9ca3af;
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.toolbar__search :deep(input.form-control) {
  padding-left: 38px;
}

.toolbar__select {
  width: 180px;
}

.table-shell {
  padding: 0;
  overflow: hidden;
}

.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.empty-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #6b7280;
}

.empty-state__title {
  font-weight: 700;
  color: #111827;
}

.reader-table thead tr {
  background: #f8fafc;
}

.reader-table th {
  text-align: left;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.reader-table td {
  padding: 12px 14px;
  font-size: 0.875rem;
  color: #334155;
  border-bottom: 1px solid #eef2f7;
  vertical-align: top;
}

.reader-table tbody tr:hover {
  background: #f8fafc;
}

.row--blacklisted {
  background: #fff7f7;
}

.row--blacklisted:hover {
  background: #ffefef;
}

.mono {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 0.78rem;
  color: #64748b;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 700;
}

.badge--blue {
  background: #dbeafe;
  color: #1e40af;
}

.badge--amber {
  background: #fef3c7;
  color: #92400e;
}

.badge--red {
  background: #fee2e2;
  color: #991b1b;
}

.badge--green {
  background: #dcfce7;
  color: #166534;
}

.blacklist-reason {
  margin-top: 4px;
  font-size: 0.75rem;
  color: #b91c1c;
  max-width: 210px;
  line-height: 1.3;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero__cta {
    width: 100%;
    justify-content: center;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar__select {
    width: 100%;
  }
}
</style>
