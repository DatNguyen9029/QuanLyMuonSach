<template>
  <div class="borrow-page">
    <!-- ═══ PAGE HEADER ═══ -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Mượn / Trả sách</h1>
        <p class="page-subtitle">
          Theo dõi và xử lý các phiếu mượn sách trong hệ thống
        </p>
      </div>
      <button @click="openNewBorrowModal" class="btn-primary">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Tạo phiếu mượn
      </button>
    </div>

    <!-- ═══ STATS ROW ═══ -->
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

    <!-- ═══ TAB BAR ═══ -->
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

    <!-- ═══ TOOLBAR ═══ -->
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

    <!-- ═══ TABLE ═══ -->
    <div class="table-card">
      <!-- Loading state -->
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

      <!-- Data Table -->
      <template v-else>
        <table class="data-table" v-if="filteredBorrows.length > 0">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Độc giả</th>
              <th>Sách mượn</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="borrow in filteredBorrows"
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
                    {{ borrow.reader?.name?.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="reader-name">{{ borrow.reader?.name }}</p>
                    <p class="reader-email">{{ borrow.reader?.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <div class="book-cell">
                  <p class="book-title">{{ borrow.book?.title }}</p>
                  <p class="book-author">{{ borrow.book?.author }}</p>
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
              <td>
                <div class="action-buttons">
                  <!-- PENDING: Approve or Reject -->
                  <template v-if="borrow.status === 'pending'">
                    <button
                      @click="approveBorrow(borrow)"
                      class="action-btn action-btn--approve"
                      title="Duyệt mượn"
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
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      Duyệt
                    </button>
                    <button
                      @click="openRejectModal(borrow)"
                      class="action-btn action-btn--reject"
                      title="Từ chối"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </template>

                  <!-- APPROVED: Confirm return -->
                  <template v-if="borrow.status === 'approved'">
                    <button
                      @click="openReturnModal(borrow)"
                      class="action-btn action-btn--return"
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
                          d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                        />
                      </svg>
                      Trả sách
                    </button>
                    <button
                      @click="openExtendModal(borrow)"
                      class="action-btn action-btn--extend"
                      title="Gia hạn"
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
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </template>

                  <!-- RETURNED: View only -->
                  <template v-if="borrow.status === 'returned'">
                    <span class="returned-label">Đã hoàn tất</span>
                  </template>

                  <!-- Detail button always visible -->
                  <button
                    @click="viewDetail(borrow)"
                    class="action-btn action-btn--ghost"
                    title="Chi tiết"
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
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
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
          <span>{{
            activeTab === "pending"
              ? "Chưa có yêu cầu mượn sách nào đang chờ xử lý"
              : "Không tìm thấy dữ liệu phù hợp"
          }}</span>
        </div>
      </template>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage--"
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
          :key="page"
          @click="page !== '...' && (currentPage = page)"
          class="page-btn"
          :class="{
            'page-btn--active': page === currentPage,
            'page-btn--ellipsis': page === '...',
          }"
        >
          {{ page }}
        </button>
        <button
          @click="currentPage++"
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

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: XÁC NHẬN TRẢ SÁCH + TÍNH TIỀN PHẠT                       -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
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
              <!-- Book Info -->
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

              <!-- Fine Calculator -->
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

                <!-- Fine Type Radio -->
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

                <!-- Late fine detail -->
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

                <!-- Lost fine detail -->
                <div
                  v-if="returnForm.fineType === 'lost'"
                  class="fine-detail-box"
                >
                  <div class="fine-row">
                    <span class="fine-row-label">Giá gốc sách</span>
                    <span class="fine-row-value">{{
                      formatCurrency(selectedBorrow.book?.price)
                    }}</span>
                  </div>
                  <div class="fine-row fine-row--total">
                    <span class="fine-row-label">Tiền phạt</span>
                    <span class="fine-row-value total-amount">{{
                      formatCurrency(lostFine)
                    }}</span>
                  </div>
                </div>

                <!-- No fine -->
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

              <!-- Note -->
              <div class="form-group">
                <label class="input-label">Ghi chú (tùy chọn)</label>
                <textarea
                  v-model="returnForm.note"
                  placeholder="Nhập ghi chú về tình trạng sách khi trả..."
                  class="input-field"
                  rows="2"
                ></textarea>
              </div>

              <!-- Total Summary -->
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

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: TỪ CHỐI MỘT PHIẾU MƯỢN                                     -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
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
                  placeholder="Nhập lý do từ chối (sẽ gửi thông báo đến độc giả)..."
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

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: GIA HẠN SÁCH                                               -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
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
                Xác nhận gia hạn
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">
        <span>{{ toast.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useBorrowStore } from "@/stores/borrow.store";
import { storeToRefs } from "pinia";

// ─── STATUS BADGE COMPONENT (inline) ─────────────────────────────────────────
const StatusBadge = {
  props: ["status"],
  setup(props) {
    const config = {
      pending: { label: "Chờ duyệt", cls: "badge--pending" },
      approved: { label: "Đang mượn", cls: "badge--approved" },
      returned: { label: "Đã trả", cls: "badge--returned" },
      rejected: { label: "Từ chối", cls: "badge--rejected" },
      lost: { label: "Mất sách", cls: "badge--overdue" },
      overdue: { label: "Quá hạn", cls: "badge--overdue" },
    };
    return {
      c: computed(
        () => config[props.status] || { label: props.status, cls: "" },
      ),
    };
  },
  template: `<span class="status-badge" :class="c.cls">{{ c.label }}</span>`,
};

// ─── STORE ────────────────────────────────────────────────────────────────────
const borrowStore = useBorrowStore();
const { borrows, isLoading, pagination } = storeToRefs(borrowStore);

// ─── STATE ────────────────────────────────────────────────────────────────────
const activeTab = ref("pending");
const searchQuery = ref("");
const filterDate = ref("");
const currentPage = ref(1);
const selectedBorrow = ref(null);
const isSubmitting = ref(false);

// Modals
const showReturnModal = ref(false);
const showRejectModal = ref(false);
const showExtendModal = ref(false);

// Return form
const returnForm = ref({
  fineType: "none",
  note: "",
});

// Extend form
const extendDays = ref(7);

// Reject
const rejectReason = ref("");

// Toast
const toast = ref({ show: false, type: "success", message: "" });

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const fineRatePerDay = 5000; // VND per day late

// ─── TABS ─────────────────────────────────────────────────────────────────────
const tabs = computed(() => [
  {
    key: "pending",
    label: "Chờ duyệt",
    color: "amber",
    count: borrows.value.filter((b) => b.status === "pending").length,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  },
  {
    key: "approved",
    label: "Đang mượn",
    color: "blue",
    count: borrows.value.filter((b) => b.status === "approved").length,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" /></svg>`,
  },
  {
    key: "returned",
    label: "Đã trả",
    color: "green",
    count: borrows.value.filter((b) => b.status === "returned").length,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`,
  },
  {
    key: "rejected",
    label: "Từ chối",
    color: "red",
    count: borrows.value.filter((b) => b.status === "rejected").length,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>`,
  },
  {
    key: "lost",
    label: "Mất sách",
    color: "red",
    count: borrows.value.filter((b) => b.status === "lost").length,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75c-4.97 0-9 3.022-9 6.75 0 1.498.651 2.882 1.75 4.01L3.75 21l4.146-1.381A10.66 10.66 0 0012 20.25c4.97 0 9-3.022 9-6.75s-4.03-6.75-9-6.75z" /></svg>`,
  },
]);

// ─── STATS ────────────────────────────────────────────────────────────────────
const stats = computed(() => [
  {
    label: "Chờ duyệt",
    value: borrows.value.filter((b) => b.status === "pending").length,
    color: "amber",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  },
  {
    label: "Đang mượn",
    value: borrows.value.filter((b) => b.status === "approved").length,
    color: "blue",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" /></svg>`,
  },
  {
    label: "Quá hạn",
    value: borrows.value.filter((b) => isOverdue(b)).length,
    color: "red",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
  },
  {
    label: "Đã trả (tháng này)",
    value: borrows.value.filter((b) => b.status === "returned").length,
    color: "green",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  },
]);

// ─── COMPUTED ─────────────────────────────────────────────────────────────────
const filteredBorrows = computed(() => {
  let list = borrows.value.filter((b) => b.status === activeTab.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (b) =>
        b.reader?.name?.toLowerCase().includes(q) ||
        b.book?.title?.toLowerCase().includes(q) ||
        b.borrowCode?.toLowerCase().includes(q),
    );
  }
  return list;
});

const totalPages = computed(() => pagination.value?.totalPages || 1);
const visiblePages = computed(() => {
  const pages = [];
  for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  return pages.slice(0, 7); // simplified
});

// ─── FINE CALCULATION ─────────────────────────────────────────────────────────
const computedOverdueDays = computed(() => {
  if (!selectedBorrow.value) return 0;
  const now = new Date();
  const due = new Date(selectedBorrow.value.dueDate);
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
});

const lateFine = computed(() => computedOverdueDays.value * fineRatePerDay);
const lostFine = computed(
  () => selectedBorrow.value?.book?.price || 0,
);

const totalFine = computed(() => {
  if (returnForm.value.fineType === "late") return lateFine.value;
  if (returnForm.value.fineType === "lost") return lostFine.value;
  return 0;
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
}

function isOverdue(borrow) {
  if (borrow.status !== "approved") return false;
  return new Date() > new Date(borrow.dueDate);
}

function getOverdueDays(borrow) {
  const now = new Date();
  const due = new Date(borrow.dueDate);
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
}

function getDueDateClass(borrow) {
  if (borrow.status !== "approved") return "";
  if (isOverdue(borrow)) return "date-overdue";
  const daysLeft = Math.floor(
    (new Date(borrow.dueDate) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft <= 3) return "date-warning";
  return "date-ok";
}

function getNewDueDate() {
  if (!selectedBorrow.value) return null;
  const d = new Date(selectedBorrow.value.dueDate);
  d.setDate(d.getDate() + (extendDays.value || 0));
  return d;
}

function showToast(type, message) {
  toast.value = { show: true, type, message };
  setTimeout(() => (toast.value.show = false), 3000);
}

let searchTimer = null;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {}, 300);
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────
function openNewBorrowModal() {
  /* TODO */
}
function viewDetail(borrow) {
  /* TODO: open detail drawer */
}
function exportData() {
  /* TODO: call export API */
}

function openReturnModal(borrow) {
  selectedBorrow.value = borrow;
  returnForm.value = {
    fineType: isOverdue(borrow) ? "late" : "none",
    note: "",
  };
  showReturnModal.value = true;
}

function openRejectModal(borrow) {
  selectedBorrow.value = borrow;
  rejectReason.value = "";
  showRejectModal.value = true;
}

function openExtendModal(borrow) {
  selectedBorrow.value = borrow;
  extendDays.value = 7;
  showExtendModal.value = true;
}

async function approveBorrow(borrow) {
  try {
    await borrowStore.approveBorrow(borrow._id);
    showToast("success", `Đã duyệt phiếu mượn #${borrow.borrowCode}`);
  } catch {
    showToast("error", "Có lỗi xảy ra, vui lòng thử lại");
  }
}

async function confirmReturn() {
  isSubmitting.value = true;
  try {
    await borrowStore.returnBook(selectedBorrow.value._id, {
      markAsLost: returnForm.value.fineType === "lost",
    });
    showReturnModal.value = false;
    showToast(
      "success",
      returnForm.value.fineType === "lost"
        ? "Đã ghi nhận mất sách thành công!"
        : "Đã xác nhận trả sách thành công!",
    );
  } catch {
    showToast("error", "Có lỗi xảy ra khi xử lý trả sách");
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) return;
  isSubmitting.value = true;
  try {
    await borrowStore.rejectBorrow(
      selectedBorrow.value._id,
      rejectReason.value,
    );
    showRejectModal.value = false;
    showToast("success", "Đã từ chối yêu cầu mượn sách");
  } catch {
    showToast("error", "Có lỗi xảy ra");
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmExtend() {
  isSubmitting.value = true;
  try {
    await borrowStore.extendBorrow(selectedBorrow.value._id, extendDays.value);
    showExtendModal.value = false;
    showToast("success", `Đã gia hạn thêm ${extendDays.value} ngày`);
  } catch {
    showToast("error", "Có lỗi xảy ra khi gia hạn");
  } finally {
    isSubmitting.value = false;
  }
}

// ─── WATCHERS ─────────────────────────────────────────────────────────────────
watch(activeTab, () => {
  currentPage.value = 1;
  borrowStore.fetchBorrows({ status: activeTab.value, page: 1 });
});
watch(currentPage, (page) => {
  borrowStore.fetchBorrows({ status: activeTab.value, page });
});

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────
onMounted(() => {
  borrowStore.fetchBorrows({ status: "pending" });
});
</script>

<style scoped>
/* ─── PAGE ─────────────────────────────────────────────────────────── */
.borrow-page {
  font-family: "Geist", "DM Sans", system-ui, sans-serif;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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

/* ─── STATS ──────────────────────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8e3db;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.stat-card--amber .stat-icon {
  background: #fef3c7;
  color: #d97706;
}
.stat-card--blue .stat-icon {
  background: #dbeafe;
  color: #2563eb;
}
.stat-card--red .stat-icon {
  background: #fee2e2;
  color: #dc2626;
}
.stat-card--green .stat-icon {
  background: #d1fae5;
  color: #059669;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1;
  letter-spacing: -0.03em;
}
.stat-label {
  font-size: 0.78rem;
  color: #9ca3af;
  margin-top: 4px;
  font-weight: 500;
}

/* ─── TABS ────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 4px;
  background: white;
  border: 1px solid #e8e3db;
  border-radius: 12px;
  padding: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 8px;
  border: none;
  background: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.tab-btn:hover {
  background: #f4f2ee;
  color: #1a1a2e;
}
.tab-btn--active {
  background: #0f1623;
  color: white;
}

.tab-count {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}
.tab-count--amber {
  background: #fef3c7;
  color: #d97706;
}
.tab-count--blue {
  background: #dbeafe;
  color: #2563eb;
}
.tab-count--green {
  background: #d1fae5;
  color: #059669;
}
.tab-count--red {
  background: #fee2e2;
  color: #dc2626;
}
.tab-btn--active .tab-count {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* ─── TOOLBAR ────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #e8e3db;
  border-radius: 10px;
  padding: 0 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.search-box:focus-within {
  border-color: #d4a843;
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.1);
}
.search-box svg {
  width: 18px;
  height: 18px;
  color: #9ca3af;
  flex-shrink: 0;
}
.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.875rem;
  color: #1a1a2e;
  padding: 10px 0;
  background: transparent;
}
.search-box input::placeholder {
  color: #9ca3af;
}
.search-clear {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 2px 4px;
}

.toolbar-filters {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e8e3db;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #374151;
  background: white;
  cursor: pointer;
  outline: none;
}
.filter-select:focus {
  border-color: #d4a843;
}

/* ─── BUTTONS ────────────────────────────────────────────────────── */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #0f1623;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-primary:hover {
  background: #1a2540;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary svg {
  width: 18px;
  height: 18px;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #e8e3db;
  background: white;
  color: #374151;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-outline:hover {
  border-color: #d4a843;
  color: #d4a843;
}
.btn-outline svg {
  width: 16px;
  height: 16px;
}

.btn-ghost {
  padding: 10px 18px;
  background: none;
  border: 1px solid #e8e3db;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover {
  background: #f4f2ee;
}

.btn-danger {
  padding: 10px 18px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-danger:hover {
  background: #b91c1c;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── TABLE CARD ─────────────────────────────────────────────────── */
.table-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e8e3db;
  overflow: hidden;
}

/* Skeleton */
.table-loading {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
}
.skeleton {
  background: linear-gradient(90deg, #f0ece3 25%, #e8e3db 50%, #f0ece3 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table thead tr {
  background: #faf8f5;
  border-bottom: 1px solid #e8e3db;
}
.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9ca3af;
  white-space: nowrap;
}

.table-row {
  border-bottom: 1px solid #f0ece3;
  transition: background 0.15s;
}
.table-row:last-child {
  border-bottom: none;
}
.table-row:hover {
  background: #faf8f5;
}
.table-row.row--overdue {
  background: #fff9f9;
}
.table-row.row--overdue:hover {
  background: #fff1f1;
}

.data-table td {
  padding: 14px 16px;
  vertical-align: middle;
}

.borrow-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
}

.reader-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.reader-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f1623, #2a3a5c);
  color: #d4a843;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.reader-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a2e;
}
.reader-email {
  font-size: 0.75rem;
  color: #9ca3af;
}

.book-cell .book-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a2e;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.book-cell .book-author {
  font-size: 0.75rem;
  color: #9ca3af;
}

.date-cell {
  font-size: 0.84rem;
  color: #374151;
}
.date-overdue {
  color: #dc2626;
  font-weight: 600;
}
.date-warning {
  color: #d97706;
  font-weight: 600;
}
.date-ok {
  color: #059669;
}
.overdue-days {
  font-size: 0.7rem;
  color: #dc2626;
  margin-top: 2px;
  font-weight: 600;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
.badge--pending {
  background: #fef3c7;
  color: #d97706;
}
.badge--approved {
  background: #dbeafe;
  color: #2563eb;
}
.badge--returned {
  background: #d1fae5;
  color: #059669;
}
.badge--rejected {
  background: #fee2e2;
  color: #dc2626;
}
.badge--overdue {
  background: #fee2e2;
  color: #dc2626;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.action-btn svg {
  width: 14px;
  height: 14px;
}
.action-btn--approve {
  background: #d1fae5;
  color: #059669;
}
.action-btn--approve:hover {
  background: #059669;
  color: white;
}
.action-btn--reject {
  background: #fee2e2;
  color: #dc2626;
  padding: 6px 8px;
}
.action-btn--reject:hover {
  background: #dc2626;
  color: white;
}
.action-btn--return {
  background: #dbeafe;
  color: #2563eb;
}
.action-btn--return:hover {
  background: #2563eb;
  color: white;
}
.action-btn--extend {
  background: #fef3c7;
  color: #d97706;
  padding: 6px 8px;
}
.action-btn--extend:hover {
  background: #d97706;
  color: white;
}
.action-btn--ghost {
  background: #f4f2ee;
  color: #6b7280;
  padding: 6px 8px;
}
.action-btn--ghost:hover {
  background: #e8e3db;
  color: #1a1a2e;
}

.returned-label {
  font-size: 0.78rem;
  color: #9ca3af;
  font-style: italic;
}

/* Empty State */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #9ca3af;
}
.empty-state svg {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  opacity: 0.4;
}
.empty-state p {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
}
.empty-state span {
  font-size: 0.85rem;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
}
.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e8e3db;
  background: white;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.page-btn svg {
  width: 16px;
  height: 16px;
}
.page-btn:hover:not(:disabled):not(.page-btn--ellipsis) {
  border-color: #d4a843;
  color: #d4a843;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-btn--active {
  background: #0f1623;
  color: white;
  border-color: #0f1623;
}
.page-btn--ellipsis {
  cursor: default;
  border-color: transparent;
}

/* ─── MODALS ─────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 22, 35, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal--sm {
  max-width: 440px;
}
.modal--return {
  max-width: 600px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e3db;
}
.modal-header--danger {
  background: #fff9f9;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
}
.modal-title svg {
  width: 22px;
  height: 22px;
  color: #d4a843;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e8e3db;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover {
  background: #f4f2ee;
  color: #374151;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e8e3db;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Return modal specific */
.return-book-info {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #faf8f5;
  border-radius: 12px;
}
.book-cover-placeholder {
  width: 60px;
  height: 80px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f1623, #2a3a5c);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.book-cover-placeholder svg {
  width: 28px;
  height: 28px;
  color: #d4a843;
}

.book-return-details h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a2e;
}
.book-return-details p {
  font-size: 0.82rem;
  color: #6b7280;
  margin-top: 2px;
}
.return-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
}
.return-meta span {
  font-size: 0.78rem;
  color: #9ca3af;
}
.return-meta strong {
  color: #374151;
}

/* Fine calculator */
.fine-calculator {
  background: #faf8f5;
  border-radius: 12px;
  padding: 16px;
}
.fine-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 14px;
}
.fine-title svg {
  width: 18px;
  height: 18px;
  color: #d4a843;
}

.fine-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}
.fine-option {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border: 1.5px solid #e8e3db;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}
.fine-option input {
  display: none;
}
.fine-option > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fine-option-icon {
  font-size: 1rem;
}
.fine-option-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}
.fine-option--active {
  border-color: #d4a843;
  background: #fffbf0;
}
.fine-option--active .fine-option-label {
  color: #d97706;
}

.fine-detail-box {
  background: white;
  border-radius: 10px;
  padding: 14px;
  border: 1px solid #e8e3db;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fine-detail-box--success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 500;
}

.fine-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.fine-row-label {
  font-size: 0.82rem;
  color: #6b7280;
}
.fine-row-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}
.fine-row-value.overdue {
  color: #dc2626;
}
.fine-row--total {
  border-top: 1px dashed #e8e3db;
  padding-top: 8px;
  margin-top: 4px;
}
.total-amount {
  color: #dc2626;
  font-size: 1rem;
  font-weight: 800;
}

.damage-slider {
  width: 100%;
  margin: 8px 0;
  accent-color: #d4a843;
}
.damage-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #9ca3af;
}

.return-summary {
  background: #0f1623;
  border-radius: 12px;
  padding: 16px 20px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary-row span {
  color: #8a93a8;
  font-size: 0.85rem;
}
.summary-total {
  font-size: 1.2rem;
  font-weight: 800;
  color: #d4a843;
}
.summary-total--red {
  color: #f87171;
}

/* Form inputs */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
}
.required {
  color: #dc2626;
}
.input-field {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e8e3db;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #1a1a2e;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.input-field:focus {
  border-color: #d4a843;
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.1);
}

/* Reject modal */
.reject-info {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
}
.reject-info strong {
  color: #1a1a2e;
}

/* Extend modal */
.extend-book-info {
  padding: 12px;
  background: #faf8f5;
  border-radius: 10px;
}
.extend-book-info p {
  font-size: 0.9rem;
  color: #1a1a2e;
}
.text-muted {
  color: #6b7280 !important;
  font-size: 0.8rem !important;
  margin-top: 4px;
}

.extend-days-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.extend-options {
  display: flex;
  gap: 8px;
}
.extend-option {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #e8e3db;
  border-radius: 10px;
  background: white;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.extend-option:hover {
  border-color: #d4a843;
  color: #d97706;
}
.extend-option--active {
  border-color: #d4a843;
  background: #fffbf0;
  color: #d97706;
}

.extend-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #d1fae5;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #065f46;
}
.extend-preview strong {
  font-size: 1rem;
}
.extend-note {
  font-size: 0.78rem;
  color: #9ca3af;
}

/* Loading spinner */
.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─── TOAST ──────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  z-index: 9999;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
.toast--success {
  background: #059669;
  color: white;
}
.toast--error {
  background: #dc2626;
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

/* ─── MODAL TRANSITION ───────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: inherit;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .modal {
  transform: scale(0.94) translateY(20px);
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .modal {
  transform: scale(0.94) translateY(20px);
}

.mt-3 {
  margin-top: 12px;
}
.mt-4 {
  margin-top: 16px;
}
</style>
