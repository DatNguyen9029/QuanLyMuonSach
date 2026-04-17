<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- ═══════════════════════════════ SIDEBAR ═══════════════════════════════ -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <Transition name="label-fade">
          <span v-if="!isSidebarCollapsed" class="logo-text"
            >Happy Library</span
          >
        </Transition>
      </div>

      <!-- User Info -->
      <div class="sidebar-user">
        <div class="user-avatar">
          <img
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            alt="avatar"
          />
          <span v-else>{{ userInitial }}</span>
        </div>
        <Transition name="label-fade">
          <div v-if="!isSidebarCollapsed" class="user-info">
            <p class="user-name">{{ authStore.user?.hoTen || "Người dùng" }}</p>
            <span
              class="user-role"
              :class="authStore.isAdmin ? 'role-admin' : 'role-user'"
            >
              {{ authStore.isAdmin ? "Quản trị viên" : "Người dùng" }}
            </span>
          </div>
        </Transition>
      </div>

      <!-- Nav Menu -->
      <nav class="sidebar-nav">
        <p class="nav-section-label">
          <Transition name="label-fade">
            <span v-if="!isSidebarCollapsed">Điều hướng</span>
            <span v-else>—</span>
          </Transition>
        </p>

        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.to) }"
          :title="isSidebarCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <Transition name="label-fade">
            <span v-if="!isSidebarCollapsed" class="nav-label">{{
              item.label
            }}</span>
          </Transition>
          <Transition name="label-fade">
            <span v-if="!isSidebarCollapsed && item.badge" class="nav-badge">{{
              item.badge
            }}</span>
          </Transition>
        </router-link>

        <!-- Admin only section -->
        <template v-if="authStore.isAdmin">
          <p class="nav-section-label mt-4">
            <Transition name="label-fade">
              <span v-if="!isSidebarCollapsed">Quản trị</span>
              <span v-else>—</span>
            </Transition>
          </p>
          <router-link
            v-for="item in adminNavItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--active': isActive(item.to) }"
            :title="isSidebarCollapsed ? item.label : ''"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <Transition name="label-fade">
              <span v-if="!isSidebarCollapsed" class="nav-label">{{
                item.label
              }}</span>
            </Transition>
            <Transition name="label-fade">
              <span
                v-if="!isSidebarCollapsed && item.badge"
                class="nav-badge"
                >{{ item.badge }}</span
              >
            </Transition>
          </router-link>
        </template>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button
          @click="handleLogout"
          class="nav-item nav-item--logout"
          :title="isSidebarCollapsed ? 'Đăng xuất' : ''"
        >
          <span class="nav-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </span>
          <Transition name="label-fade">
            <span v-if="!isSidebarCollapsed" class="nav-label">Đăng xuất</span>
          </Transition>
        </button>
      </div>

      <!-- Collapse toggle -->
      <button
        class="sidebar-toggle"
        @click="isSidebarCollapsed = !isSidebarCollapsed"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :style="{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none' }"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>
    </aside>

    <!-- ═══════════════════════════════ MAIN AREA ═══════════════════════════════ -->
    <div class="main-area">
      <!-- HEADER -->
      <header class="main-header">
        <div class="header-left">
          <!-- Mobile menu toggle -->
          <button
            class="mobile-menu-btn"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
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
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <div class="header-breadcrumb">
            <span class="breadcrumb-page">{{ currentPageTitle }}</span>
          </div>
        </div>

        <div class="header-right">
          <!-- Notification Bell -->
          <button
            class="header-icon-btn"
            @click="toggleNotifications"
            style="position: relative"
            type="button"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <span v-if="notificationCount > 0" class="notif-dot">{{
              notificationCount
            }}</span>
          </button>

          <!-- Avatar + Dropdown -->
          <div
            class="header-avatar-wrapper"
            @click="isProfileDropdownOpen = !isProfileDropdownOpen"
          >
            <div class="header-avatar">
              <img
                v-if="authStore.user?.avatar"
                :src="authStore.user.avatar"
                alt="avatar"
              />
              <span v-else>{{ userInitial }}</span>
            </div>
            <div class="header-avatar-info">
              <p class="avatar-name">{{ authStore.user?.hoTen }}</p>
              <p class="avatar-email">{{ authStore.user?.email }}</p>
            </div>
            <svg
              class="dropdown-chevron"
              viewBox="0 0 20 20"
              fill="currentColor"
              :style="{
                transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'none',
              }"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <!-- Profile Dropdown -->
          <Transition name="dropdown">
            <div v-if="isProfileDropdownOpen" class="profile-dropdown">
              <router-link
                to="/profile"
                class="dropdown-item"
                @click="isProfileDropdownOpen = false"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                Hồ sơ cá nhân
              </router-link>
              <button
                @click="handleLogout"
                class="dropdown-item dropdown-item--danger"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                Đăng xuất
              </button>
            </div>
          </Transition>
        </div>
      </header>

      <!-- PAGE CONTENT -->
      <main class="main-content">
        <RouterView v-slot="{ Component, route }">
          <!-- KEEP ALIVE -->
          <KeepAlive>
            <component
              v-if="route.meta.keepAlive"
              :is="Component"
              :key="route.path"
            />
          </KeepAlive>

          <!-- NORMAL -->
          <component
            v-if="!route.meta.keepAlive"
            :is="Component"
            :key="route.path"
          />
        </RouterView>
      </main>
    </div>

    <!-- Chat Widget (floating) -->
    <ChatWidget v-if="authStore.isLoggedIn && !authStore.isAdmin" />
    <NotificationToast v-if="authStore.isLoggedIn" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useBorrowStore } from "@/stores/borrow.store";
import { useNotificationStore } from "@/stores/notification.store";
import { connectSocket, disconnectSocket } from "@/services/socket";
import ChatWidget from "@/components/chat/ChatWidget.vue";
import NotificationToast from "@/components/common/NotificationToast.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const borrowStore = useBorrowStore();
const notificationStore = useNotificationStore();

const isSidebarCollapsed = ref(false);
const isMobileMenuOpen = ref(false);
const isProfileDropdownOpen = ref(false);

const userInitial = computed(() =>
  (authStore.user?.hoTen || "U").charAt(0).toUpperCase(),
);

const pendingBorrowCount = computed(() => borrowStore.pendingCount || 0);
const notificationCount = computed(() => notificationStore.unreadCount || 0);

const currentPageTitle = computed(() => {
  const titles = {
    "/dashboard": "Tổng quan",
    "/books": authStore.isAdmin ? "Quản lý Sách" : "Sách",
    "/borrows": "Quản lý Mượn / Trả",
    "/readers": "Quản lý Độc giả",
    "/publishers": "Quản lý NXB",
    "/chat": "Tin nhắn",
    "/notifications": "Thông báo",
    "/profile": "Hồ sơ cá nhân",
  };
  return titles[route.path] || "Happy Library";
});

// ─── NAV ITEMS ───────────────────────────────────────────────────────────────
const navItems = computed(() => [
  {
    to: "/dashboard",
    label: "Tổng quan",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>`,
  },
  {
    to: "/books",
    label: authStore.isAdmin ? "Quản lý Sách" : "Sách",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" /></svg>`,
  },
  {
    to: "/notifications",
    label: "Thông báo",
    badge: notificationCount.value > 0 ? notificationCount.value : null,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>`,
  },
]);

const adminNavItems = computed(() => [
  {
    to: "/chat",
    label: "Tin nhắn hỗ trợ",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>`,
  },
  {
    to: "/borrows",
    label: "Mượn / Trả sách",
    badge: pendingBorrowCount.value > 0 ? pendingBorrowCount.value : null,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>`,
  },
  {
    to: "/readers",
    label: "Quản lý Độc giả",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>`,
  },
  {
    to: "/publishers",
    label: "Quản lý NXB",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 21V5.25A2.25 2.25 0 0017.25 3H6.75A2.25 2.25 0 004.5 5.25V21m15 0h-15m15 0h1.125a1.125 1.125 0 001.125-1.125V8.25M4.5 21H3.375A1.125 1.125 0 012.25 19.875V8.25m2.25 12.75V9A2.25 2.25 0 016.75 6.75h10.5A2.25 2.25 0 0119.5 9v12M8.25 10.5h7.5M8.25 14.25h7.5" /></svg>`,
  },
]);

const isActive = (path) => route.path.startsWith(path);

function toggleNotifications() {
  isProfileDropdownOpen.value = false;
  router.push("/notifications");
}

async function handleLogout() {
  await authStore.logout();
  router.push("/auth/login");
}

// Close dropdown on outside click
function handleOutsideClick(e) {
  if (
    !e.target.closest(".header-avatar-wrapper") &&
    !e.target.closest(".profile-dropdown")
  ) {
    isProfileDropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);

  if (authStore.isLoggedIn) {
    const socket = connectSocket();
    notificationStore.init(socket).catch(() => {});
  }

  if (authStore.isAdmin) {
    borrowStore.fetchPendingCount().catch(() => {});
  } else {
    borrowStore.pendingCount = 0;
  }
});
onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick);
  notificationStore.detachSocketListeners();
  disconnectSocket();
});
</script>

<style scoped>
/* ─── CSS VARIABLES ────────────────────────────────────────────── */
:root {
  --sidebar-w: 260px;
  --sidebar-w-collapsed: 72px;
  --header-h: 64px;
  --sidebar-bg: #0f1623;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --accent: #d4a843;
  --accent-muted: rgba(212, 168, 67, 0.12);
  --text-primary: #f0ece3;
  --text-muted: #7a8499;
}

/* ─── APP SHELL ────────────────────────────────────────────────── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f4f2ee;
  font-family: "Geist", "DM Sans", system-ui, sans-serif;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ─── SIDEBAR ──────────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-w);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--sidebar-border);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.app-shell.sidebar-collapsed .sidebar {
  width: var(--sidebar-w-collapsed);
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid var(--sidebar-border);
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #d4a843, #e8c96a);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-icon svg {
  width: 20px;
  height: 20px;
  color: #0f1623;
}

.logo-text {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

/* User info */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--sidebar-border);
  overflow: hidden;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2a3a5c, #3a4e7a);
  border: 2px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--accent);
  font-size: 0.9rem;
  flex-shrink: 0;
  overflow: hidden;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  overflow: hidden;
}
.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-block;
  margin-top: 3px;
}
.role-admin {
  background: rgba(212, 168, 67, 0.2);
  color: #d4a843;
}
.role-user {
  background: rgba(52, 196, 143, 0.15);
  color: #34c48f;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.nav-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 8px 10px 4px;
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #8a93a8;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}
.nav-item--active {
  background: var(--accent-muted) !important;
  color: var(--accent) !important;
}
.nav-item--active .nav-icon svg {
  stroke: var(--accent);
}
.nav-item--logout {
  color: #e05c5c;
}
.nav-item--logout:hover {
  background: rgba(224, 92, 92, 0.1);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  background: #e05c5c;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 10px;
  border-top: 1px solid var(--sidebar-border);
}

/* Collapse toggle */
.sidebar-toggle {
  position: absolute;
  right: -12px;
  top: 78px;
  width: 24px;
  height: 24px;
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  z-index: 10;
  transition: all 0.2s;
}
.sidebar-toggle svg {
  width: 14px;
  height: 14px;
  transition: transform 0.3s;
}
.sidebar-toggle:hover {
  color: var(--text-primary);
}

/* ─── MAIN AREA ────────────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* HEADER */
.main-header {
  height: var(--header-h);
  background: #fff;
  border-bottom: 1px solid #e8e3db;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  position: relative;
  z-index: 20;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6b7280;
}
.mobile-menu-btn svg {
  width: 20px;
  height: 20px;
}

.breadcrumb-page {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.header-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f4f2ee;
  border: 1px solid #e8e3db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.header-icon-btn:hover {
  background: #ede8e0;
  color: #1a1a2e;
}
.header-icon-btn svg {
  width: 18px;
  height: 18px;
}

.notif-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e05c5c;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.header-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #e8e3db;
  background: #f4f2ee;
  transition: all 0.2s;
}
.header-avatar-wrapper:hover {
  background: #ede8e0;
}

.header-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #d4a843, #e8c96a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: #0f1623;
  overflow: hidden;
  flex-shrink: 0;
}
.header-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-avatar-info {
  display: none;
}
@media (min-width: 640px) {
  .header-avatar-info {
    display: block;
  }
}
.avatar-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1a1a2e;
}
.avatar-email {
  font-size: 0.7rem;
  color: #9ca3af;
}

.dropdown-chevron {
  width: 14px;
  height: 14px;
  color: #9ca3af;
  transition: transform 0.2s;
}

/* Profile Dropdown */
.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: white;
  border: 1px solid #e8e3db;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.dropdown-item:hover {
  background: #f9f7f4;
}
.dropdown-item svg {
  width: 16px;
  height: 16px;
}
.dropdown-item--danger {
  color: #e05c5c;
}
.dropdown-item--danger:hover {
  background: #fef2f2;
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  background: #f4f2ee;
}

/* ─── TRANSITIONS ──────────────────────────────────────────────── */
.label-fade-enter-active,
.label-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
