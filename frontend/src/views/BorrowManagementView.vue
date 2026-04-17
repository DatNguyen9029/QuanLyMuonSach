<template>
  <div class="borrow-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Mượn / Trả sách</h1>
        <p class="page-subtitle">
          Theo dõi và xử lý các phiếu mượn sách trong hệ thống
        </p>
      </div>

      <button v-if="isReader" @click="openNewBorrowModal" class="btn-primary">
        Tạo phiếu mượn
      </button>
      <button
        v-else-if="isAdmin"
        @click="openNewBorrowModal"
        class="btn-primary"
      >
        Tạo phiếu mượn (Admin)
      </button>
    </div>

    <div class="stats-row">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card"
        :class="`stat-card--${stat.color}`"
      >
        <div class="stat-icon" v-html="stat.icon"></div>
        <div class="stat-body">
          <p class="stat-value">{{ stat.value }}</p>
          <p class="stat-label">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab.key }"
      >
        <span v-html="tab.icon"></span>
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="tab-count"
          :class="`tab-count--${tab.color}`"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          v-model="searchQuery"
          placeholder="Tìm theo tên độc giả, mã sách, tên sách..."
          @input="debouncedSearch"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="search-clear"
        >
          ✕
        </button>
      </div>

      <div class="toolbar-filters">
        <select v-model="filterDate" class="filter-select">
          <option value="">Tất cả thời gian</option>
          <option value="today">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
        </select>
        <button @click="exportData" class="btn-outline">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Xuất Excel
        </button>
      </div>
    </div>

    <div class="table-card">
      <div v-if="isLoading" class="table-loading">
        <div v-for="i in 5" :key="i" class="skeleton-row">
          <div class="skeleton" style="width: 80px; height: 14px"></div>
          <div class="skeleton" style="width: 160px; height: 14px"></div>
          <div class="skeleton" style="width: 200px; height: 14px"></div>
          <div class="skeleton" style="width: 100px; height: 14px"></div>
          <div
            class="skeleton"
            style="width: 100px; height: 24px; border-radius: 999px"
          ></div>
          <div class="skeleton" style="width: 140px; height: 14px"></div>
          <div
            class="skeleton"
            style="width: 120px; height: 32px; border-radius: 8px"
          ></div>
        </div>
      </div>

      <template v-else>
        <table class="data-table" v-if="paginatedBorrows.length > 0">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Độc giả</th>
              <th>Sách mượn</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
              <th v-if="isAdmin">Hành động</th>
              <th v-else>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="borrow in paginatedBorrows"
              :key="borrow._id"
              class="table-row"
              :class="{ 'row--overdue': isOverdue(borrow) }"
            >
              <td>
                <span class="borrow-id">#{{ borrow.borrowCode }}</span>
              </td>
              <td>
                <div class="reader-cell">
                  <div class="reader-avatar">
                    {{ borrow.reader?.name?.charAt(0).toUpperCase() || "?" }}
                  </div>
                  <div>
                    <p class="reader-name">{{ borrow.reader?.name || "—" }}</p>
                    <p class="reader-email">
                      {{ borrow.reader?.email || "—" }}
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <div class="book-cell">
                  <p class="book-title">{{ borrow.book?.title || "—" }}</p>
                  <p class="book-author">{{ borrow.book?.author || "—" }}</p>
                </div>
              </td>
              <td class="date-cell">{{ formatDate(borrow.borrowDate) }}</td>
              <td class="date-cell">
                <span :class="getDueDateClass(borrow)">
                  {{ formatDate(borrow.dueDate) }}
                </span>
                <p v-if="isOverdue(borrow)" class="overdue-days">
                  Trễ {{ getOverdueDays(borrow) }} ngày
                </p>
              </td>
              <td>
                <StatusBadge :status="borrow.status" />
              </td>

              <td v-if="isAdmin">
                <div class="table-actions">
                  <template v-if="borrow.backendStatus === 'ChoDuyet'">
                    <button
                      @click="approveBorrow(borrow)"
                      class="icon-action-btn icon-action-btn--approve"
                      title="Duyệt"
                      aria-label="Duyệt"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m5 12 4 4L19 6" />
                      </svg>
                      <span class="action-tooltip">Duyệt</span>
                    </button>
                    <button
                      @click="openRejectModal(borrow)"
                      class="icon-action-btn icon-action-btn--reject"
                      title="Từ chối"
                      aria-label="Từ chối"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M18 6 6 18" />
                      </svg>
                      <span class="action-tooltip">Từ chối</span>
                    </button>
                  </template>

                  <template
                    v-else-if="
                      borrow.backendStatus === 'DangMuon' ||
                      borrow.status === 'overdue'
                    "
                  >
                    <button
                      @click="openReturnModal(borrow)"
                      class="icon-action-btn icon-action-btn--return"
                      title="Trả sách"
                      aria-label="Trả sách"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 12h11m0 0-4-4m4 4-4 4" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 5v14" />
                      </svg>
                      <span class="action-tooltip">Trả sách</span>
                    </button>
                    <button
                      @click="openExtendModal(borrow)"
                      class="icon-action-btn icon-action-btn--extend"
                      title="Gia hạn"
                      aria-label="Gia hạn"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3.5 2m5-2a8.5 8.5 0 1 1-3-6.5" />
                      </svg>
                      <span class="action-tooltip">Gia hạn</span>
                    </button>
                    <button
                      @click="openFineModal(borrow)"
                      class="icon-action-btn icon-action-btn--ghost"
                      title="Tính phạt"
                      aria-label="Tính phạt"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.5h9m-9 4h5m-5 4h9M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                      </svg>
                      <span class="action-tooltip">Tính phạt</span>
                    </button>
                  </template>

                  <template v-else>
                    <span class="returned-label">
                      {{ getStatusLabel(borrow.status) }}
                    </span>
                  </template>

                  <button
                    @click="viewDetail(borrow)"
                    class="icon-action-btn icon-action-btn--ghost"
                    title="Chi tiết"
                    aria-label="Chi tiết"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span class="action-tooltip">Chi tiết</span>
                  </button>
                </div>
              </td>

              <td v-else>
                <button
                  @click="viewDetail(borrow)"
                  class="icon-action-btn icon-action-btn--ghost"
                  title="Chi tiết"
                  aria-label="Chi tiết"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span class="action-tooltip">Chi tiết</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <p>Không có phiếu mượn nào</p>
          <span>
            {{
              activeTab === "pending"
                ? "Chưa có yêu cầu mượn sách nào đang chờ xử lý"
                : "Không tìm thấy dữ liệu phù hợp"
            }}
          </span>
        </div>
      </template>

      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <button
          v-for="page in visiblePages"
          :key="String(page)"
          @click="page !== '...' && goToPage(page)"
          class="page-btn"
          :class="{
            'page-btn--active': page === currentPage,
            'page-btn--ellipsis': page === '...',
          }"
        >
          {{ page }}
        </button>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Admin create borrow modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showNewBorrowModal"
          class="modal-backdrop"
          @click.self="closeNewBorrowModal"
        >
          <div class="modal modal--lg">
            <div class="modal-header">
              <h2 class="modal-title">Thêm mới phiếu mượn</h2>
              <button @click="closeNewBorrowModal" class="modal-close">
                ✕
              </button>
            </div>

            <div class="modal-body">
              <div class="borrow-form-grid">
                <div class="form-group">
                  <label class="input-label"
                    >Bạn đọc <span class="required">*</span></label
                  >
                  <select
                    v-model="newBorrowForm.userId"
                    class="input-field"
                    :class="{ 'input-field--error': createBorrowErrors.userId }"
                    :disabled="isReferenceLoading || isSubmitting"
                  >
                    <option value="">-- Chọn --</option>
                    <option
                      v-for="reader in availableReaders"
                      :key="reader._id"
                      :value="reader._id"
                    >
                      {{ reader.hoTen }} - {{ reader.email }}
                    </option>
                  </select>
                  <span v-if="createBorrowErrors.userId" class="form-error">
                    {{ createBorrowErrors.userId }}
                  </span>
                  <p v-if="newBorrowForm.userId" class="helper-text">
                    Độc giả này hiện có
                    <strong>{{
                      getReaderActiveBorrowCount(newBorrowForm.userId)
                    }}</strong>
                    sách chờ duyệt/đang mượn.
                  </p>
                </div>

                <div class="form-group">
                  <label class="input-label"
                    >Ngày mượn <span class="required">*</span></label
                  >
                  <input
                    v-model="newBorrowForm.borrowDate"
                    type="date"
                    class="input-field"
                    :class="{
                      'input-field--error': createBorrowErrors.borrowDate,
                    }"
                    :disabled="isSubmitting"
                  />
                  <span v-if="createBorrowErrors.borrowDate" class="form-error">
                    {{ createBorrowErrors.borrowDate }}
                  </span>
                </div>

                <div class="form-group">
                  <label class="input-label"
                    >Ngày hẹn trả <span class="required">*</span></label
                  >
                  <input
                    v-model="newBorrowForm.dueDate"
                    type="date"
                    class="input-field"
                    :class="{
                      'input-field--error': createBorrowErrors.dueDate,
                    }"
                    :disabled="isSubmitting"
                  />
                  <span v-if="createBorrowErrors.dueDate" class="form-error">
                    {{ createBorrowErrors.dueDate }}
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label class="input-label">Ghi chú</label>
                <textarea
                  v-model="newBorrowForm.note"
                  class="input-field"
                  rows="4"
                  placeholder="Nhập ghi chú thêm cho phiếu mượn..."
                  :disabled="isSubmitting"
                ></textarea>
              </div>

              <div class="borrow-lines">
                <table class="borrow-create-table">
                  <thead>
                    <tr>
                      <th>Nhan đề <span class="required">*</span></th>
                      <th>Thông tin sách</th>
                      <th>Số lượng mượn <span class="required">*</span></th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in newBorrowForm.items"
                      :key="item.id"
                    >
                      <td>
                        <select
                          v-model="item.bookId"
                          class="input-field input-field--compact"
                          :class="{
                            'input-field--error': getBorrowItemError(
                              index,
                              'bookId',
                            ),
                          }"
                          :disabled="isReferenceLoading || isSubmitting"
                          @change="normalizeBorrowItemQuantity(item)"
                        >
                          <option value="">-- Chọn --</option>
                          <option
                            v-for="book in availableBooks"
                            :key="book._id"
                            :value="book._id"
                            :disabled="isBookOptionDisabled(book._id, item.id)"
                          >
                            {{ book.tenSach }}
                          </option>
                        </select>
                        <span
                          v-if="getBorrowItemError(index, 'bookId')"
                          class="form-error"
                        >
                          {{ getBorrowItemError(index, "bookId") }}
                        </span>
                      </td>
                      <td>
                        <div v-if="getBookById(item.bookId)" class="book-meta">
                          <p class="book-meta__title">
                            {{ getBookById(item.bookId)?.tenSach }}
                          </p>
                          <p class="book-meta__line">
                            Tác giả:
                            {{
                              getBookById(item.bookId)?.tacGia ||
                              "Đang cập nhật"
                            }}
                          </p>
                          <p class="book-meta__line">
                            Tồn kho: {{ getBorrowLineStock(item) }} bản
                          </p>
                          <p class="book-meta__line">
                            Giá sách:
                            {{
                              formatCurrency(getBookById(item.bookId)?.donGia)
                            }}
                          </p>
                        </div>
                        <span v-else class="table-placeholder"
                          >Chọn sách để xem thông tin</span
                        >
                      </td>
                      <td>
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          min="1"
                          :max="getBorrowLineStock(item) || 1"
                          class="input-field input-field--compact"
                          :class="{
                            'input-field--error': getBorrowItemError(
                              index,
                              'quantity',
                            ),
                          }"
                          :disabled="isSubmitting"
                          @blur="normalizeBorrowItemQuantity(item)"
                        />
                        <span
                          v-if="getBorrowItemError(index, 'quantity')"
                          class="form-error"
                        >
                          {{ getBorrowItemError(index, "quantity") }}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          class="row-action-btn"
                          :disabled="isSubmitting"
                          @click="removeBorrowItem(item.id)"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                class="btn-outline"
                :disabled="isSubmitting"
                @click="addBorrowItem"
              >
                + Thêm
              </button>

              <p v-if="createBorrowErrors.itemsGeneral" class="form-error">
                {{ createBorrowErrors.itemsGeneral }}
              </p>

              <label class="inline-check">
                <input
                  v-model="newBorrowForm.saveAndContinue"
                  type="checkbox"
                />
                <span>Lưu và thêm tiếp</span>
              </label>
            </div>

            <div class="modal-footer">
              <button @click="closeNewBorrowModal" class="btn-ghost">
                Hủy bỏ
              </button>
              <button
                @click="submitNewBorrow"
                class="btn-primary"
                :disabled="isSubmitting || isReferenceLoading"
              >
                <span v-if="isSubmitting" class="loading-spinner"></span>
                {{ isSubmitting ? "Đang lưu..." : "Lưu" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Detail modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDetailModal"
          class="modal-backdrop"
          @click.self="showDetailModal = false"
        >
          <div class="modal modal--detail">
            <div class="modal-header">
              <h2 class="modal-title">Chi tiết phiếu mượn</h2>
              <button @click="showDetailModal = false" class="modal-close">
                ✕
              </button>
            </div>

            <div class="modal-body" v-if="selectedBorrow">
              <div class="detail-grid">
                <div class="detail-card">
                  <span class="detail-label">Mã phiếu</span>
                  <strong>#{{ selectedBorrow.borrowCode }}</strong>
                </div>
                <div class="detail-card">
                  <span class="detail-label">Trạng thái</span>
                  <strong>{{ getStatusLabel(selectedBorrow.status) }}</strong>
                </div>
                <div class="detail-card">
                  <span class="detail-label">Bạn đọc</span>
                  <strong>{{ selectedBorrow.reader?.name || "—" }}</strong>
                  <small>{{ selectedBorrow.reader?.email || "—" }}</small>
                </div>
                <div class="detail-card">
                  <span class="detail-label">Sách</span>
                  <strong>{{ selectedBorrow.book?.title || "—" }}</strong>
                  <small>{{ selectedBorrow.book?.author || "—" }}</small>
                </div>
                <div class="detail-card">
                  <span class="detail-label">Ngày mượn</span>
                  <strong>{{ formatDate(selectedBorrow.borrowDate) }}</strong>
                </div>
                <div class="detail-card">
                  <span class="detail-label">Ngày hẹn trả</span>
                  <strong>{{ formatDate(selectedBorrow.dueDate) }}</strong>
                </div>
                <div v-if="selectedBorrow.returnedDate" class="detail-card">
                  <span class="detail-label">Ngày trả thực tế</span>
                  <strong>{{ formatDate(selectedBorrow.returnedDate) }}</strong>
                </div>
                <div v-if="selectedBorrow.fineAmount > 0" class="detail-card">
                  <span class="detail-label">Tiền phạt</span>
                  <strong>{{
                    formatCurrency(selectedBorrow.fineAmount)
                  }}</strong>
                </div>
              </div>

              <div class="form-group">
                <label class="input-label">Ghi chú</label>
                <textarea
                  class="input-field"
                  rows="3"
                  :value="selectedBorrow.note || 'Không có ghi chú'"
                  readonly
                ></textarea>
              </div>

              <div class="form-group" v-if="selectedBorrow.rejectReason">
                <label class="input-label">Lý do từ chối</label>
                <textarea
                  class="input-field"
                  rows="3"
                  :value="selectedBorrow.rejectReason"
                  readonly
                ></textarea>
              </div>

              <div v-if="isAdmin" class="detail-actions">
                <button
                  v-if="selectedBorrow.backendStatus === 'ChoDuyet'"
                  @click="approveBorrow(selectedBorrow)"
                  class="action-btn action-btn--approve"
                >
                  Duyệt
                </button>
                <button
                  v-if="selectedBorrow.backendStatus === 'ChoDuyet'"
                  @click="openRejectModal(selectedBorrow)"
                  class="action-btn action-btn--reject"
                >
                  Từ chối
                </button>
                <button
                  v-if="
                    selectedBorrow.backendStatus === 'DangMuon' ||
                    selectedBorrow.status === 'overdue'
                  "
                  @click="openReturnModal(selectedBorrow)"
                  class="action-btn action-btn--return"
                >
                  Trả sách
                </button>
                <button
                  v-if="
                    selectedBorrow.backendStatus === 'DangMuon' ||
                    selectedBorrow.status === 'overdue'
                  "
                  @click="openExtendModal(selectedBorrow)"
                  class="action-btn action-btn--extend"
                >
                  Gia hạn
                </button>
                <button
                  v-if="
                    selectedBorrow.backendStatus === 'DangMuon' ||
                    selectedBorrow.status === 'overdue'
                  "
                  @click="openFineModal(selectedBorrow)"
                  class="action-btn action-btn--ghost"
                >
                  Tính phạt
                </button>
              </div>
            </div>

            <div class="modal-footer">
              <button @click="showDetailModal = false" class="btn-ghost">
                Đóng
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Return / fine modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showReturnModal"
          class="modal-backdrop"
          @click.self="showReturnModal = false"
        >
          <div class="modal modal--return">
            <div class="modal-header">
              <h2 class="modal-title">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                  />
                </svg>
                Xác nhận Trả sách
              </h2>
              <button @click="showReturnModal = false" class="modal-close">
                ✕
              </button>
            </div>

            <div class="modal-body" v-if="selectedBorrow">
              <div class="return-book-info">
                <div class="book-cover-placeholder">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <div class="book-return-details">
                  <h3>{{ selectedBorrow.book?.title }}</h3>
                  <p>{{ selectedBorrow.book?.author }}</p>
                  <div class="return-meta">
                    <span
                      >Độc giả:
                      <strong>{{ selectedBorrow.reader?.name }}</strong></span
                    >
                    <span
                      >Ngày mượn:
                      <strong>{{
                        formatDate(selectedBorrow.borrowDate)
                      }}</strong></span
                    >
                    <span
                      >Hạn trả:
                      <strong>{{
                        formatDate(selectedBorrow.dueDate)
                      }}</strong></span
                    >
                  </div>
                </div>
              </div>

              <div class="fine-calculator">
                <h4 class="fine-title">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Tính tiền phạt
                </h4>

                <div class="fine-type-selector">
                  <label
                    class="fine-option"
                    :class="{
                      'fine-option--active': returnForm.fineType === 'late',
                    }"
                  >
                    <input
                      type="radio"
                      v-model="returnForm.fineType"
                      value="late"
                    />
                    <div>
                      <span class="fine-option-icon">⏰</span>
                      <span class="fine-option-label">Trả trễ hạn</span>
                    </div>
                  </label>

                  <label
                    class="fine-option"
                    :class="{
                      'fine-option--active': returnForm.fineType === 'lost',
                    }"
                  >
                    <input
                      type="radio"
                      v-model="returnForm.fineType"
                      value="lost"
                    />
                    <div>
                      <span class="fine-option-icon">📖</span>
                      <span class="fine-option-label">Mất sách</span>
                    </div>
                  </label>

                  <label
                    class="fine-option"
                    :class="{
                      'fine-option--active': returnForm.fineType === 'none',
                    }"
                  >
                    <input
                      type="radio"
                      v-model="returnForm.fineType"
                      value="none"
                    />
                    <div>
                      <span class="fine-option-icon">✅</span>
                      <span class="fine-option-label">Không phạt</span>
                    </div>
                  </label>
                </div>

                <div
                  v-if="returnForm.fineType === 'late'"
                  class="fine-detail-box"
                >
                  <div class="fine-row">
                    <span class="fine-row-label">Số ngày trễ</span>
                    <span class="fine-row-value overdue"
                      >{{ computedOverdueDays }} ngày</span
                    >
                  </div>
                  <div class="fine-row">
                    <span class="fine-row-label">Đơn giá phạt / ngày</span>
                    <span class="fine-row-value">{{
                      formatCurrency(fineRatePerDay)
                    }}</span>
                  </div>
                  <div class="fine-row fine-row--total">
                    <span class="fine-row-label">Tiền phạt</span>
                    <span class="fine-row-value total-amount">{{
                      formatCurrency(lateFine)
                    }}</span>
                  </div>
                </div>

                <div
                  v-if="returnForm.fineType === 'lost'"
                  class="fine-detail-box"
                >
                  <div class="fine-row">
                    <span class="fine-row-label">Giá gốc sách</span>
                    <span class="fine-row-value">
                      {{ formatCurrency(selectedBorrow.book?.price) }}
                    </span>
                  </div>
                  <div class="fine-row fine-row--total">
                    <span class="fine-row-label">Tiền phạt</span>
                    <span class="fine-row-value total-amount">{{
                      formatCurrency(lostFine)
                    }}</span>
                  </div>
                </div>

                <div
                  v-if="returnForm.fineType === 'none'"
                  class="fine-detail-box fine-detail-box--success"
                >
                  <p>
                    ✅ Sách được trả đúng hạn và còn nguyên vẹn. Không có tiền
                    phạt.
                  </p>
                </div>
              </div>

              <div class="form-group">
                <label class="input-label">Ghi chú (tùy chọn)</label>
                <textarea
                  v-model="returnForm.note"
                  placeholder="Nhập ghi chú về tình trạng sách khi trả..."
                  class="input-field"
                  rows="2"
                ></textarea>
              </div>

              <div class="return-summary">
                <div class="summary-row">
                  <span>Tổng tiền phạt cần thu:</span>
                  <span
                    class="summary-total"
                    :class="{ 'summary-total--red': totalFine > 0 }"
                  >
                    {{ formatCurrency(totalFine) }}
                  </span>
                </div>
                <p
                  v-if="returnForm.fineType === 'lost'"
                  class="text-xs text-red-200 mt-2"
                >
                  Hệ thống sẽ ghi nhận phiếu mượn ở trạng thái mất sách.
                </p>
              </div>
            </div>

            <div class="modal-footer">
              <button @click="showReturnModal = false" class="btn-ghost">
                Hủy bỏ
              </button>
              <button
                @click="confirmReturn"
                class="btn-primary"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="loading-spinner"></span>
                {{ isSubmitting ? "Đang xử lý..." : "Xác nhận trả sách" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reject modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showRejectModal"
          class="modal-backdrop"
          @click.self="showRejectModal = false"
        >
          <div class="modal modal--sm">
            <div class="modal-header modal-header--danger">
              <h2 class="modal-title">Từ chối yêu cầu mượn</h2>
              <button @click="showRejectModal = false" class="modal-close">
                ✕
              </button>
            </div>
            <div class="modal-body">
              <p class="reject-info">
                Bạn đang từ chối yêu cầu mượn sách
                <strong>"{{ selectedBorrow?.book?.title }}"</strong>
                của độc giả <strong>{{ selectedBorrow?.reader?.name }}</strong
                >.
              </p>
              <div class="form-group">
                <label class="input-label"
                  >Lý do từ chối <span class="required">*</span></label
                >
                <textarea
                  v-model="rejectReason"
                  placeholder="Nhập lý do từ chối..."
                  class="input-field"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="showRejectModal = false" class="btn-ghost">
                Hủy
              </button>
              <button
                @click="confirmReject"
                :disabled="!rejectReason.trim() || isSubmitting"
                class="btn-danger"
              >
                <span v-if="isSubmitting" class="loading-spinner"></span>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Extend modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showExtendModal"
          class="modal-backdrop"
          @click.self="showExtendModal = false"
        >
          <div class="modal modal--sm">
            <div class="modal-header">
              <h2 class="modal-title">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Gia hạn mượn sách
              </h2>
              <button @click="showExtendModal = false" class="modal-close">
                ✕
              </button>
            </div>
            <div class="modal-body">
              <div class="extend-book-info">
                <p>
                  <strong>{{ selectedBorrow?.book?.title }}</strong>
                </p>
                <p class="text-muted">
                  Hạn trả hiện tại: {{ formatDate(selectedBorrow?.dueDate) }}
                </p>
              </div>
              <div class="extend-days-selector">
                <p class="input-label">Gia hạn thêm</p>
                <div class="extend-options">
                  <button
                    v-for="days in [7, 14, 21, 30]"
                    :key="days"
                    @click="extendDays = days"
                    class="extend-option"
                    :class="{ 'extend-option--active': extendDays === days }"
                  >
                    {{ days }} ngày
                  </button>
                </div>
              </div>
              <div class="extend-preview" v-if="extendDays">
                <span>Hạn trả mới:</span>
                <strong>{{ formatDate(getNewDueDate()) }}</strong>
              </div>
              <p class="extend-note">
                ⚠️ Mỗi phiếu mượn chỉ được gia hạn tối đa
                <strong>1 lần</strong>.
              </p>
            </div>
            <div class="modal-footer">
              <button @click="showExtendModal = false" class="btn-ghost">
                Hủy
              </button>
              <button
                @click="confirmExtend"
                :disabled="!extendDays || isSubmitting"
                class="btn-primary"
              >
                <span v-if="isSubmitting" class="loading-spinner"></span>
                {{ isSubmitting ? "Đang xử lý..." : "Xác nhận gia hạn" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Fine Calculator Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <FineCalculatorModal
          v-if="showFineModal"
          :borrow="selectedBorrow"
          :fine-per-day="fineRatePerDay"
          @close="showFineModal = false"
          @confirm="handleFineConfirm"
        />
      </Transition>
    </Teleport>

    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">
        <span>{{ toast.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  defineComponent,
  h,
} from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useBorrowStore } from "@/stores/borrow.store";
import FineCalculatorModal from "@/components/borrows/FineCalculatorModal.vue";
import api from "@/services/api";

const PAGE_SIZE = 10;
const MAX_BORROW_LIMIT = 3;
const FINE_RATE_PER_DAY = 10000;

const router = useRouter();
const authStore = useAuthStore();
const borrowStore = useBorrowStore();

const searchQuery = ref("");
const activeTab = ref("all");
const currentPage = ref(1);
const filterDate = ref("");

const selectedBorrow = ref(null);
const showDetailModal = ref(false);
const showRejectModal = ref(false);
const showReturnModal = ref(false);
const showExtendModal = ref(false);
const showFineModal = ref(false);
const showNewBorrowModal = ref(false);

const rejectReason = ref("");
const extendDays = ref(7);
const isSubmitting = ref(false);
const isReferenceLoading = ref(false);

const availableReaders = ref([]);
const availableBooks = ref([]);

const toast = ref({
  show: false,
  type: "success",
  message: "",
});

let searchTimer = null;
let toastTimer = null;

const createBorrowErrors = reactive({
  userId: "",
  borrowDate: "",
  dueDate: "",
  itemsGeneral: "",
  items: [],
});

const newBorrowForm = reactive({
  userId: "",
  borrowDate: todayInputValue(),
  dueDate: addDaysInputValue(7),
  note: "",
  items: [createBorrowItem()],
  saveAndContinue: false,
});

const returnForm = reactive({
  fineType: "late",
  note: "",
});

function todayInputValue() {
  return toDateInputValue(new Date());
}

function addDaysInputValue(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

function toDateInputValue(date) {
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

function createBorrowItem() {
  return {
    id: cryptoRandomId(),
    bookId: "",
    quantity: 1,
  };
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const isAdmin = computed(() => authStore.isAdmin);
const isReader = computed(() => !authStore.isAdmin);

const borrows = computed(() => borrowStore.borrows || []);
const isLoading = computed(() => borrowStore.isLoading);

const filteredBorrows = computed(() => {
  let list = [...borrows.value];

  if (activeTab.value !== "all") {
    list = list.filter((b) => b.status === activeTab.value);
  }

  if (filterDate.value) {
    list = list.filter((b) =>
      matchesDateFilter(b.borrowDate, filterDate.value),
    );
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((b) => {
      return (
        b.borrowCode?.toLowerCase().includes(q) ||
        b.reader?.name?.toLowerCase().includes(q) ||
        b.reader?.email?.toLowerCase().includes(q) ||
        b.reader?.phone?.toLowerCase().includes(q) ||
        b.book?.title?.toLowerCase().includes(q) ||
        b.book?.author?.toLowerCase().includes(q)
      );
    });
  }

  return list;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredBorrows.value.length / PAGE_SIZE)),
);

const paginatedBorrows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredBorrows.value.slice(start, start + PAGE_SIZE);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i += 1) pages.push(i);
  if (right < total - 1) pages.push("...");
  pages.push(total);

  return pages;
});

const pendingCount = computed(
  () => borrows.value.filter((b) => b.backendStatus === "ChoDuyet").length,
);
const approvedCount = computed(
  () => borrows.value.filter((b) => b.backendStatus === "DangMuon").length,
);
const overdueCount = computed(
  () => borrows.value.filter((b) => b.status === "overdue").length,
);
const returnedCount = computed(
  () => borrows.value.filter((b) => b.backendStatus === "DaTra").length,
);

const stats = computed(() => [
  {
    label: "Chờ duyệt",
    value: pendingCount.value,
    color: "yellow",
    icon: iconPending,
  },
  {
    label: "Đang mượn",
    value: approvedCount.value,
    color: "blue",
    icon: iconBorrowing,
  },
  {
    label: "Quá hạn",
    value: overdueCount.value,
    color: "red",
    icon: iconOverdue,
  },
  {
    label: "Đã trả",
    value: returnedCount.value,
    color: "green",
    icon: iconReturned,
  },
]);

const tabs = computed(() => [
  {
    key: "all",
    label: "Tất cả",
    count: filteredBorrows.value.length,
    color: "gray",
    icon: iconAll,
  },
  {
    key: "pending",
    label: "Chờ duyệt",
    count: pendingCount.value,
    color: "yellow",
    icon: iconPending,
  },
  {
    key: "approved",
    label: "Đang mượn",
    count: approvedCount.value,
    color: "blue",
    icon: iconBorrowing,
  },
  {
    key: "overdue",
    label: "Quá hạn",
    count: overdueCount.value,
    color: "red",
    icon: iconOverdue,
  },
  {
    key: "returned",
    label: "Đã trả",
    count: returnedCount.value,
    color: "green",
    icon: iconReturned,
  },
  {
    key: "rejected",
    label: "Từ chối",
    count: borrows.value.filter((b) => b.backendStatus === "TuChoi").length,
    color: "gray",
    icon: iconRejected,
  },
]);

const StatusBadge = defineComponent({
  name: "StatusBadge",
  props: {
    status: {
      type: String,
      default: "pending",
    },
  },
  setup(props) {
    return () =>
      h(
        "span",
        {
          class: ["status-badge", `status-badge--${props.status || "pending"}`],
        },
        getStatusLabel(props.status),
      );
  },
});

function matchesDateFilter(dateValue, filter) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();

  if (filter === "today") {
    return date.toDateString() === now.toDateString();
  }

  if (filter === "week") {
    const start = new Date(now);
    const day = start.getDay() || 7;
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (day - 1));

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return date >= start && date < end;
  }

  if (filter === "month") {
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  return true;
}

async function loadData() {
  if (isAdmin.value) {
    await Promise.all([
      borrowStore.fetchBorrows({ page: 1, limit: 9999 }),
      borrowStore.fetchPendingCount().catch(() => {}),
    ]);
  } else {
    await borrowStore.fetchMyBorrows();
  }
  currentPage.value = 1;
}

async function loadReferenceData() {
  if (!isAdmin.value) return;

  isReferenceLoading.value = true;
  try {
    const [readersRes, booksRes] = await Promise.all([
      api.get("/users", { params: { role: "user", limit: 9999 } }),
      api.get("/books", { params: { limit: 9999 } }),
    ]);

    const readerList =
      readersRes.data?.data || readersRes.data?.users || readersRes.data || [];
    const bookList =
      booksRes.data?.data || booksRes.data?.books || booksRes.data || [];

    availableReaders.value = Array.isArray(readerList) ? readerList : [];
    availableBooks.value = Array.isArray(bookList) ? bookList : [];
  } catch (error) {
    console.error("Load reference data error:", error);
    showToast("Không tải được dữ liệu bạn đọc / sách.", "error");
  } finally {
    isReferenceLoading.value = false;
  }
}

onMounted(async () => {
  await loadData();
  await loadReferenceData();
});

watch(
  () => authStore.isAdmin,
  async () => {
    await loadData();
    await loadReferenceData();
  },
);

watch([searchQuery, activeTab, filterDate], () => {
  currentPage.value = 1;
});

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal;
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  if (toastTimer) clearTimeout(toastTimer);
});

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
  }, 150);
}

function openNewBorrowModal() {
  if (isReader.value) {
    router.push("/books");
    return;
  }

  if (isAdmin.value) {
    resetNewBorrowForm();
    showNewBorrowModal.value = true;
    if (!availableReaders.value.length || !availableBooks.value.length) {
      loadReferenceData();
    }
  }
}

function closeNewBorrowModal() {
  showNewBorrowModal.value = false;
  resetNewBorrowForm();
}

function resetNewBorrowForm() {
  newBorrowForm.userId = "";
  newBorrowForm.borrowDate = todayInputValue();
  newBorrowForm.dueDate = addDaysInputValue(7);
  newBorrowForm.note = "";
  newBorrowForm.items = [createBorrowItem()];
  newBorrowForm.saveAndContinue = false;
  clearCreateBorrowErrors();
}

function clearCreateBorrowErrors() {
  createBorrowErrors.userId = "";
  createBorrowErrors.borrowDate = "";
  createBorrowErrors.dueDate = "";
  createBorrowErrors.itemsGeneral = "";
  createBorrowErrors.items = [];
}

function viewDetail(borrow) {
  selectedBorrow.value = borrow;
  showDetailModal.value = true;
}

function openRejectModal(borrow) {
  selectedBorrow.value = borrow;
  rejectReason.value = "";
  showRejectModal.value = true;
}

function openReturnModal(borrow) {
  selectedBorrow.value = borrow;
  returnForm.fineType = borrow.status === "overdue" ? "late" : "none";
  returnForm.note = "";
  showReturnModal.value = true;
}

function openExtendModal(borrow) {
  selectedBorrow.value = borrow;
  extendDays.value = 7;
  showExtendModal.value = true;
}

function openFineModal(borrow) {
  selectedBorrow.value = borrow;
  showFineModal.value = true;
}

function goToPage(page) {
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages.value);
  currentPage.value = safePage;
}

async function approveBorrow(borrow) {
  if (!borrow?._id) return;
  isSubmitting.value = true;
  try {
    await borrowStore.approveBorrow(borrow._id);
    showToast("Đã duyệt phiếu mượn.", "success");
    await loadData();
    showDetailModal.value = false;
  } catch (error) {
    showToast(
      error?.response?.data?.message ||
        error.message ||
        "Duyệt phiếu thất bại.",
      "error",
    );
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmReject() {
  if (!selectedBorrow.value?._id) return;
  isSubmitting.value = true;
  try {
    await borrowStore.rejectBorrow(
      selectedBorrow.value._id,
      rejectReason.value,
    );
    showToast("Đã từ chối phiếu mượn.", "success");
    showRejectModal.value = false;
    showDetailModal.value = false;
    selectedBorrow.value = null;
    await loadData();
  } catch (error) {
    showToast(
      error?.response?.data?.message ||
        error.message ||
        "Từ chối phiếu thất bại.",
      "error",
    );
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmReturn() {
  if (!selectedBorrow.value?._id) return;
  isSubmitting.value = true;
  try {
    await borrowStore.returnBook(selectedBorrow.value._id, {
      markAsLost: returnForm.fineType === "lost",
    });
    showToast("Đã cập nhật trạng thái trả sách.", "success");
    showReturnModal.value = false;
    showDetailModal.value = false;
    selectedBorrow.value = null;
    await loadData();
  } catch (error) {
    showToast(
      error?.response?.data?.message ||
        error.message ||
        "Xác nhận trả sách thất bại.",
      "error",
    );
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmExtend() {
  if (!selectedBorrow.value?._id) return;
  isSubmitting.value = true;
  try {
    await borrowStore.extendBorrow(selectedBorrow.value._id, extendDays.value);
    showToast("Đã gia hạn phiếu mượn.", "success");
    showExtendModal.value = false;
    showDetailModal.value = false;
    selectedBorrow.value = null;
    await loadData();
  } catch (error) {
    showToast(
      error?.response?.data?.message ||
        error.message ||
        "Gia hạn phiếu thất bại.",
      "error",
    );
  } finally {
    isSubmitting.value = false;
  }
}

async function handleFineConfirm(fineData) {
  if (!fineData?.borrowId) return;
  isSubmitting.value = true;
  try {
    showToast(
      `Đã ghi nhận phạt ${formatCurrency(fineData.fine)} cho ${fineData.daysOverdue} ngày trễ.`,
      "success",
    );
    showFineModal.value = false;
    showDetailModal.value = false;
    selectedBorrow.value = null;
    await loadData();
  } catch (error) {
    showToast(
      error?.response?.data?.message ||
        error.message ||
        "Tính phạt thất bại.",
      "error",
    );
  } finally {
    isSubmitting.value = false;
  }
}

function submitNewBorrow() {
  validateCreateBorrowForm();
  if (hasCreateBorrowErrors()) return;

  isSubmitting.value = true;
  const payload = {
    userId: newBorrowForm.userId,
    ngayMuon: newBorrowForm.borrowDate,
    ngayHenTra: newBorrowForm.dueDate,
    ghiChu: newBorrowForm.note,
    items: newBorrowForm.items.map((item) => ({
      bookId: item.bookId,
      quantity: Number(item.quantity || 1),
    })),
  };

  borrowStore
    .createAdminBorrow(payload)
    .then(async () => {
      showToast("Đã tạo phiếu mượn.", "success");
      if (!newBorrowForm.saveAndContinue) {
        closeNewBorrowModal();
      } else {
        newBorrowForm.items = [createBorrowItem()];
        newBorrowForm.note = "";
        newBorrowForm.userId = "";
        newBorrowForm.borrowDate = todayInputValue();
        newBorrowForm.dueDate = addDaysInputValue(7);
        clearCreateBorrowErrors();
      }
      await loadData();
    })
    .catch((error) => {
      showToast(
        error?.response?.data?.message ||
          error.message ||
          "Tạo phiếu mượn thất bại.",
        "error",
      );
    })
    .finally(() => {
      isSubmitting.value = false;
    });
}

function validateCreateBorrowForm() {
  clearCreateBorrowErrors();

  if (!newBorrowForm.userId)
    createBorrowErrors.userId = "Vui lòng chọn bạn đọc.";
  if (!newBorrowForm.borrowDate)
    createBorrowErrors.borrowDate = "Vui lòng chọn ngày mượn.";
  if (!newBorrowForm.dueDate)
    createBorrowErrors.dueDate = "Vui lòng chọn ngày hẹn trả.";

  if (newBorrowForm.borrowDate && newBorrowForm.dueDate) {
    const borrowDate = new Date(newBorrowForm.borrowDate);
    const dueDate = new Date(newBorrowForm.dueDate);
    if (dueDate < borrowDate) {
      createBorrowErrors.dueDate =
        "Ngày hẹn trả phải lớn hơn hoặc bằng ngày mượn.";
    }
  }

  const activeCount = getReaderActiveBorrowCount(newBorrowForm.userId);
  const plannedCount = newBorrowForm.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  if (activeCount + plannedCount > MAX_BORROW_LIMIT) {
    createBorrowErrors.itemsGeneral = `Độc giả hiện đã có ${activeCount} sách chờ duyệt/đang mượn. Tối đa là ${MAX_BORROW_LIMIT} cuốn.`;
  }

  const itemErrors = [];
  const cleanedItems = [];
  for (const [index, item] of newBorrowForm.items.entries()) {
    const err = {};
    if (!item.bookId) err.bookId = "Chọn sách.";
    const qty = Number(item.quantity || 0);
    if (!Number.isInteger(qty) || qty <= 0)
      err.quantity = "Số lượng phải là số nguyên dương.";

    const stock = getBorrowLineStock(item);
    if (item.bookId && qty > stock) {
      err.quantity = `Số lượng không được vượt quá tồn kho (${stock}).`;
    }

    if (Object.keys(err).length > 0) {
      itemErrors[index] = err;
    }

    if (item.bookId && qty > 0) {
      cleanedItems.push({ bookId: item.bookId, quantity: qty });
    }
  }

  if (cleanedItems.length === 0) {
    createBorrowErrors.itemsGeneral = "Vui lòng thêm ít nhất một sách hợp lệ.";
  }

  createBorrowErrors.items = itemErrors;
}

function hasCreateBorrowErrors() {
  return Boolean(
    createBorrowErrors.userId ||
    createBorrowErrors.borrowDate ||
    createBorrowErrors.dueDate ||
    createBorrowErrors.itemsGeneral ||
    (createBorrowErrors.items && createBorrowErrors.items.length > 0),
  );
}

function getBorrowItemError(index, field) {
  return createBorrowErrors.items?.[index]?.[field] || "";
}

function addBorrowItem() {
  newBorrowForm.items.push(createBorrowItem());
}

function removeBorrowItem(itemId) {
  newBorrowForm.items = newBorrowForm.items.filter(
    (item) => item.id !== itemId,
  );
  if (newBorrowForm.items.length === 0) {
    newBorrowForm.items = [createBorrowItem()];
  }
}

function normalizeBorrowItemQuantity(item) {
  const stock = getBorrowLineStock(item);
  let qty = Number(item.quantity || 1);
  if (!Number.isInteger(qty) || qty < 1) qty = 1;
  if (stock > 0 && qty > stock) qty = stock;
  item.quantity = qty;
}

function getBookById(bookId) {
  return availableBooks.value.find(
    (book) => String(book._id) === String(bookId),
  );
}

function getBorrowLineStock(item) {
  const book = getBookById(item.bookId);
  if (!book) return 0;

  const baseStock = Number(book.soLuongTienTai ?? book.stock ?? 0);
  const sameBookTotal = newBorrowForm.items
    .filter((line) => line.bookId === item.bookId)
    .reduce((sum, line) => sum + Number(line.quantity || 0), 0);

  return Math.max(0, baseStock - (sameBookTotal - Number(item.quantity || 0)));
}

function isBookOptionDisabled(bookId, currentItemId) {
  return newBorrowForm.items.some(
    (item) =>
      item.id !== currentItemId && String(item.bookId) === String(bookId),
  );
}

function getReaderActiveBorrowCount(userId) {
  return borrows.value.filter((borrow) => {
    const rid = borrow.reader?.id || borrow.reader?._id || borrow.readerId;
    return (
      String(rid) === String(userId) &&
      ["pending", "approved", "overdue"].includes(borrow.status)
    );
  }).length;
}

function getNewDueDate() {
  if (!selectedBorrow.value?.dueDate) return null;
  const d = new Date(selectedBorrow.value.dueDate);
  d.setDate(d.getDate() + Number(extendDays.value || 0));
  return d;
}

const fineRatePerDay = computed(() => FINE_RATE_PER_DAY);

const computedOverdueDays = computed(() => {
  if (!selectedBorrow.value?.dueDate) return 0;
  const due = new Date(selectedBorrow.value.dueDate);
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

const lateFine = computed(
  () => computedOverdueDays.value * fineRatePerDay.value,
);
const lostFine = computed(() => Number(selectedBorrow.value?.book?.price || 0));
const totalFine = computed(() => {
  if (returnForm.fineType === "late") return lateFine.value;
  if (returnForm.fineType === "lost") return lostFine.value;
  return 0;
});

function getDueDateClass(borrow) {
  return borrow.status === "overdue"
    ? "due-date due-date--overdue"
    : "due-date";
}

function isOverdue(borrow) {
  return borrow.status === "overdue";
}

function getOverdueDays(borrow) {
  return borrow.overdueDays || 0;
}

function getStatusLabel(status) {
  const map = {
    all: "Tất cả",
    pending: "Chờ duyệt",
    approved: "Đang mượn",
    overdue: "Quá hạn",
    returned: "Đã trả",
    rejected: "Từ chối",
    lost: "Mất sách",
  };
  return map[status] || "Không xác định";
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("vi-VN");
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function showToast(message, type = "success") {
  toast.value = {
    show: true,
    type,
    message,
  };

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 2600);
}

async function exportData() {
  const rows = filteredBorrows.value;
  if (!rows.length) {
    showToast("Không có dữ liệu để xuất.", "error");
    return;
  }

  const headers = [
    "Mã phiếu",
    "Độc giả",
    "Sách",
    "Ngày mượn",
    "Hạn trả",
    "Trạng thái",
    "Tiền phạt",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((borrow) =>
      [
        csvEscape(borrow.borrowCode),
        csvEscape(borrow.reader?.name || ""),
        csvEscape(borrow.book?.title || ""),
        csvEscape(formatDate(borrow.borrowDate)),
        csvEscape(formatDate(borrow.dueDate)),
        csvEscape(getStatusLabel(borrow.status)),
        csvEscape(String(borrow.fineAmount || 0)),
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `borrow-records-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const s = String(value ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

const iconAll = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 17.25V6.75z" />
</svg>`;

const iconPending = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m5-3a8 8 0 11-16 0 8 8 0 0116 0z" />
</svg>`;

const iconBorrowing = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
</svg>`;

const iconOverdue = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4.5m0 3h.008M10.34 3.91l-7.5 13.5A1.5 1.5 0 004.14 19.5h15.72a1.5 1.5 0 001.3-2.09l-7.5-13.5a1.5 1.5 0 00-2.62 0z" />
</svg>`;

const iconReturned = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7" />
</svg>`;

const iconRejected = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
</svg>`;

defineExpose({
  loadData,
  loadReferenceData,
});
</script>

<style scoped>
.borrow-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.04em;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 4px;
}

.btn-primary,
.btn-outline,
.btn-ghost,
.btn-danger,
.action-btn {
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-primary {
  background: #d4a843;
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: #c29838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 168, 67, 0.3);
}

.btn-outline {
  background: #f8f5ee;
  color: #7a5b12;
  border: 1px solid #ead9aa;
}
.btn-outline:hover:not(:disabled) {
  background: #f0e8d8;
  border-color: #d4a843;
}

.btn-ghost {
  background: #f4f2ee;
  color: #374151;
}
.btn-ghost:hover:not(:disabled) {
  background: #e8e4dc;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 8px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8e3db;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #d4a843;
}

.stat-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.stat-value {
  font-size: 1.45rem;
  font-weight: 800;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.tab-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e8e3db;
  background: white;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.tab-btn:hover:not(.tab-btn--active) {
  background: #f9f7f4;
  border-color: #d4a843;
  transform: translateY(-1px);
}

.tab-btn--active {
  background: #1a1a2e;
  color: white;
  border-color: #1a1a2e;
}

.tab-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.tab-count {
  background: #eef2ff;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.tab-btn--active .tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 280px;
  max-width: 560px;
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e8e3db;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  gap: 10px;
  transition: all 0.2s ease;
  height: 44px;
}

.search-box:focus-within {
  border-color: #d4a843;
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.1);
}

.search-box svg {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  flex-shrink: 0;
}

.search-box input,
.filter-select,
.input-field {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.9rem;
}

.search-box input::placeholder {
  color: #9ca3af;
}

.search-clear {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.search-clear:hover {
  background: #f3f4f6;
  color: #374151;
}

.toolbar-filters {
  display: flex;
  gap: 10px;
  align-items: stretch;
  flex-wrap: nowrap;
}

.filter-select {
  min-width: 160px;
  background: white;
  border: 1px solid #e8e3db;
  border-radius: 12px;
  padding: 0 2.1rem 0 1rem;
  height: 44px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.filter-select:hover {
  border-color: #d4a843;
}

.filter-select:focus {
  outline: none;
  border-color: #d4a843;
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.1);
}

.toolbar .btn-outline {
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 1rem;
}

.btn-outline svg {
  width: 16px;
  height: 16px;
  margin-right: 0;
  flex-shrink: 0;
}

.table-card {
  background: white;
  border: 1px solid #e8e3db;
  border-radius: 16px;
  padding: 24px;
  min-height: 400px;
}

.table-loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 0;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 6px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 16px 14px;
  border-bottom: 2px solid #e8e3db;
  text-align: left;
  font-weight: 700;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #fafaf9;
}

.data-table td {
  padding: 16px 14px;
  border-bottom: 1px solid #f1ede7;
  text-align: left;
  vertical-align: top;
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #fafaf9;
}

.table-row:last-child td {
  border-bottom: none;
}

.borrow-id {
  font-weight: 700;
}

.reader-cell,
.book-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.reader-avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #f4f2ee;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.reader-name,
.book-title {
  font-weight: 700;
}

.reader-email,
.book-author,
.date-cell {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.icon-action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #e8e3db;
  border-radius: 999px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.18s ease;
  color: #6b7280;
}

.icon-action-btn svg {
  width: 14px;
  height: 14px;
}

.icon-action-btn:hover:not(:disabled),
.icon-action-btn:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.icon-action-btn:focus-visible {
  outline: 2px solid rgba(212, 168, 67, 0.5);
  outline-offset: 2px;
}

.icon-action-btn--approve {
  background: #e9fbea;
  color: #1f7a3d;
  border-color: #bcecc9;
}

.icon-action-btn--approve:hover:not(:disabled),
.icon-action-btn--approve:focus-visible {
  background: #d6f5de;
}

.icon-action-btn--reject {
  background: #fff1f2;
  color: #be123c;
  border-color: #fecdd3;
}

.icon-action-btn--reject:hover:not(:disabled),
.icon-action-btn--reject:focus-visible {
  background: #ffe4e6;
}

.icon-action-btn--return {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.icon-action-btn--return:hover:not(:disabled),
.icon-action-btn--return:focus-visible {
  background: #dbeafe;
}

.icon-action-btn--extend {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}

.icon-action-btn--extend:hover:not(:disabled),
.icon-action-btn--extend:focus-visible {
  background: #fef3c7;
}

.icon-action-btn--ghost {
  background: #f8fafc;
  color: #475569;
  border-color: #e2e8f0;
}

.icon-action-btn--ghost:hover:not(:disabled),
.icon-action-btn--ghost:focus-visible {
  background: #f1f5f9;
}

.icon-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  background: #111827;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.15s ease;
  pointer-events: none;
}

.action-tooltip::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border-width: 4px;
  border-style: solid;
  border-color: #111827 transparent transparent transparent;
}

.icon-action-btn:hover .action-tooltip,
.icon-action-btn:focus-visible .action-tooltip {
  opacity: 1;
  visibility: visible;
}

.returned-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}

.action-btn {
  background: #f4f2ee;
  padding: 0.55rem 0.9rem;
  border: 1px solid #e8e3db;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn--approve {
  background: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}
.action-btn--approve:hover:not(:disabled) {
  background: #bbf7d0;
}

.action-btn--reject {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}
.action-btn--reject:hover:not(:disabled) {
  background: #fecaca;
}

.action-btn--return {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.action-btn--return:hover:not(:disabled) {
  background: #bfdbfe;
}

.action-btn--extend {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}
.action-btn--extend:hover:not(:disabled) {
  background: #fde68a;
}

.action-btn--ghost {
  background: #f4f2ee;
  color: #374151;
  border-color: #e8e3db;
}
.action-btn--ghost:hover:not(:disabled) {
  background: #e8e4dc;
}

.status-badge {
  display: inline-flex;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
}

.status-badge--pending {
  background: #fef3c7;
  color: #92400e;
}
.status-badge--approved {
  background: #dbeafe;
  color: #1d4ed8;
}
.status-badge--returned {
  background: #dcfce7;
  color: #166534;
}
.status-badge--rejected {
  background: #fee2e2;
  color: #991b1b;
}
.status-badge--overdue {
  background: #fee2e2;
  color: #b91c1c;
}
.status-badge--lost {
  background: #f3e8ff;
  color: #6b21a8;
}

.due-date--overdue {
  color: #b91c1c;
  font-weight: 700;
}

.overdue-days {
  margin-top: 4px;
  color: #b91c1c;
  font-size: 0.8rem;
}

.empty-state {
  padding: 80px 20px;
  text-align: center;
  color: #6b7280;
  background: #fafaf9;
  border-radius: 12px;
  margin: 20px 0;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: #9ca3af;
}

.empty-state p {
  font-size: 1.125rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 8px;
}

.empty-state span {
  font-size: 0.875rem;
  color: #9ca3af;
  display: block;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e8e3db;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled):not(.page-btn--ellipsis) {
  border-color: #d4a843;
  background: #fafaf9;
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn svg {
  width: 18px;
  height: 18px;
}

.page-btn--active {
  background: #1a1a2e;
  color: white;
  border-color: #1a1a2e;
}

.page-btn--active:hover {
  background: #2a2a3e;
}

.page-btn--ellipsis {
  cursor: default;
  border-color: transparent;
}

.page-btn--ellipsis:hover {
  background: white;
  transform: none;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 9999;
}

.modal {
  width: min(100%, 760px);
  max-height: 90vh;
  overflow: auto;
  background: white;
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.24);
}

.modal--lg {
  width: min(100%, 1100px);
}
.modal--sm {
  width: min(100%, 560px);
}
.modal--detail {
  width: min(100%, 920px);
}
.modal--return {
  width: min(100%, 900px);
}

.modal-header,
.modal-footer {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-header {
  border-bottom: 1px solid #f1ede7;
}

.modal-header--danger {
  background: #fef2f2;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 800;
}

.modal-title svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.modal--return .modal-title {
  font-size: 1rem;
  font-weight: 700;
}

.modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
  color: #6b7280;
}

.modal-body {
  padding: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.input-label {
  font-size: 0.9rem;
  font-weight: 700;
}

.required {
  color: #dc2626;
}

.input-field {
  border: 1px solid #d9d5cc;
  border-radius: 12px;
  padding: 0.82rem 0.95rem;
  background: white;
}

.input-field--compact {
  padding: 0.65rem 0.8rem;
}

.input-field--error {
  border-color: #dc2626;
}

.form-error {
  color: #dc2626;
  font-size: 0.82rem;
}

.helper-text,
.text-muted {
  color: #6b7280;
  font-size: 0.85rem;
}

.borrow-form-grid,
.detail-grid {
  display: grid;
  gap: 14px;
}

.borrow-form-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 16px;
}

.detail-card {
  background: #f9fafb;
  border: 1px solid #edf0f4;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.borrow-lines {
  overflow-x: auto;
  margin: 16px 0;
}

.borrow-create-table {
  width: 100%;
  border-collapse: collapse;
}

.borrow-create-table th,
.borrow-create-table td {
  border-bottom: 1px solid #f1ede7;
  padding: 12px 10px;
  text-align: left;
  vertical-align: top;
}

.book-meta__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.book-meta__line {
  color: #6b7280;
  font-size: 0.84rem;
}

.table-placeholder {
  color: #9ca3af;
  font-size: 0.85rem;
}

.row-action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e8e3db;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

.inline-check {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
  color: #374151;
}

.return-book-info {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.book-cover-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: #f4f2ee;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.book-return-details h3 {
  font-weight: 800;
  margin-bottom: 4px;
}

.return-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  color: #4b5563;
  font-size: 0.9rem;
}

.fine-calculator {
  background: #fafafa;
  border: 1px solid #edf0f4;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.fine-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  margin-bottom: 14px;
}

.modal--return .fine-title {
  font-size: 0.95rem;
  line-height: 1.35;
}

.modal--return .fine-title svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.fine-type-selector {
  display: grid;
  gap: 10px;
}

.fine-option {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  background: white;
}

.fine-option--active {
  border-color: #d4a843;
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.12);
}

.fine-option input {
  margin-right: 4px;
}

.fine-option-label {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
}

.fine-option-icon {
  font-size: 0.9rem;
  line-height: 1;
  margin-right: 6px;
}

.fine-detail-box {
  background: #fff;
  border: 1px solid #edf0f4;
  border-radius: 14px;
  padding: 14px;
  margin-top: 14px;
}

.fine-detail-box--success {
  background: #f0fdf4;
  color: #166534;
}

.fine-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  font-size: 0.9rem;
}

.fine-row-label {
  color: #6b7280;
}

.fine-row-value {
  font-weight: 600;
}

.fine-row--total {
  border-top: 1px dashed #e5e7eb;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: 800;
}

.overdue {
  color: #dc2626;
}

.total-amount {
  font-size: 1rem;
  font-weight: 800;
}

.return-summary {
  background: #1a1a2e;
  color: white;
  border-radius: 14px;
  padding: 16px;
  font-size: 0.92rem;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.summary-total {
  font-size: 1.1rem;
  font-weight: 800;
}

.summary-total--red {
  color: #fca5a5;
}

.extend-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.extend-option {
  border: 1px solid #e8e3db;
  background: white;
  border-radius: 999px;
  padding: 0.65rem 0.9rem;
  cursor: pointer;
}

.extend-option--active {
  background: #1a1a2e;
  color: white;
}

.extend-preview {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  background: #f9fafb;
  border: 1px solid #edf0f4;
  border-radius: 12px;
  padding: 12px 14px;
}

.extend-note,
.reject-info {
  color: #6b7280;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.detail-actions .action-btn {
  padding: 0.5rem 0.82rem;
  font-size: 0.82rem;
  border-radius: 8px;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  padding: 16px 20px;
  border-radius: 12px;
  color: white;
  z-index: 10000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  font-weight: 600;
  min-width: 280px;
  max-width: 400px;
  backdrop-filter: blur(8px);
}

.toast--success {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}
.toast--error {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}
.toast--info {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.row--overdue {
  background: #fff1f2;
  border-left: 3px solid #dc2626;
}

.row--overdue:hover {
  background: #ffe4e6;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-enter-active,
.modal-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to,
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1024px) {
  .borrow-form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-card {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .borrow-page {
    padding: 16px;
    gap: 20px;
  }

  .page-title {
    font-size: 1.4rem;
  }

  .stats-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tab-bar {
    gap: 8px;
  }

  .tab-btn {
    padding: 0.6rem 0.9rem;
    font-size: 0.875rem;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-box {
    max-width: 100%;
    min-width: 100%;
  }

  .toolbar-filters {
    width: 100%;
    justify-content: stretch;
    flex-wrap: nowrap;
  }

  .filter-select {
    flex: 1;
  }

  .btn-outline {
    flex: 1;
  }

  .table-card {
    padding: 16px;
    border-radius: 12px;
  }

  .data-table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .data-table thead,
  .data-table tbody,
  .data-table tr {
    display: block;
  }

  .data-table thead {
    display: none;
  }

  .data-table tr {
    margin-bottom: 16px;
    border: 1px solid #e8e3db;
    border-radius: 12px;
    padding: 12px;
    background: white;
  }

  .data-table td {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f1ede7;
  }

  .data-table td:last-child {
    border-bottom: none;
  }

  .data-table td::before {
    content: attr(data-label);
    font-weight: 700;
    color: #6b7280;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .table-actions {
    width: auto;
    justify-content: flex-end;
    gap: 8px;
  }

  .modal {
    width: 100%;
    margin: 0 12px;
  }

  .modal-body {
    max-height: 60vh;
  }
}

@media (max-width: 480px) {
  .borrow-page {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary {
    width: 100%;
  }

  .pagination {
    gap: 4px;
  }

  .page-btn {
    min-width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
}
</style>
