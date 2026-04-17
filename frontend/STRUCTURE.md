# Happy Library Frontend - Project Structure & Best Practices

## 📋 Project Overview

**Happy Library Frontend** là một ứng dụng web Vue 3 hiện đại cho phép quản lý mượn sách, độc giả, và giao tiếp thời gian thực.

**Stack công nghệ:**

- Vue 3 (Composition API)
- Vite (Build tool)
- Pinia (State management)
- Vue Router 4 (Routing)
- TailwindCSS (Styling)
- Axios (HTTP client)
- Socket.IO (Real-time)

---

## 📁 Cấu Trúc Thư Mục Chi Tiết

### Root Level Files

```
.env.example              # Template cho environment variables
.env.local               # Local environment (git ignored)
.eslintrc.json          # ESLint configuration
.gitignore              # Git ignore rules
index.html              # HTML entry point
jsconfig.json           # JavaScript path aliases
package.json            # Dependencies & scripts
package-lock.json       # Locked versions
postcss.config.js       # PostCSS configuration (for Tailwind)
README.md               # Main project README
README-DEV.md          # Development guide
tailwind.config.js      # Tailwind CSS customization
vite.config.js          # Vite configuration
```

### `src/` Directory

#### **main.js** - Application Entry Point

```javascript
// Khởi tạo Vue app
// Setup Pinia store
// Setup Vue Router
// Import global styles
// Mount app vào #app DOM element
```

#### **App.vue** - Root Component

```vue
<!-- Thường chỉ chứa <router-view /> -->
<!-- Global layouts được handle bởi router config -->
<!-- Sử dụng cho global state, theme, etc.nếu cần -->
```

---

## 📄 Views (Pages)

### Structure

```
src/views/
├── DashboardView.vue
├── BookManagementView.vue
├── BorrowManagementView.vue
├── ChatView.vue
├── ReaderManagementView.vue
├── auth/
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   └── OAuthCallbackView.vue
└── error/
    ├── NotFoundView.vue (404)
    └── ForbiddenView.vue (403)
```

### Naming Convention

- File names: PascalCase + "View" suffix
- Route names: PascalCase
- Component exports: Definieren as `default`

### Example View Structure

```vue
<template>
  <div class="page-container">
    <!-- Page content -->
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Component logic
</script>

<style scoped>
/* Component-specific styles */
</style>
```

---

## 🧩 Components

### Structure

```
src/components/
├── common/              # Shared across app
│   ├── AppBadge.vue
│   ├── AppDataTable.vue
│   └── AppModel.vue
├── books/               # Feature-specific
│   └── BookFormModal.vue
├── borrows/
│   ├── BorrowDetailModal.vue
│   └── FineCalculatorModal.vue
├── chat/
│   └── ChatWidget.vue
└── dashboard/
    └── StatCard.vue
```

### Component Naming & Organization

- **Common Components**: Reusable across multiple features
- **Feature Components**: Specific to a feature/domain
- **Naming**: PascalCase, descriptive names
- **Organization**: Group by feature/domain

### Example Component

```vue
<template>
  <div class="component-container">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["submit"]);

const handleSubmit = () => {
  emit("submit", data);
};
</script>

<style scoped>
.component-container {
  /* Scoped styles */
}
</style>
```

### Component Best Practices

1. **Props**: Always define with types and validation
2. **Emits**: Define all emitted events
3. **Setup**: Use `<script setup>` syntax for simplicity
4. **Slots**: Use named slots for flexibility
5. **Styles**: Use `scoped` to avoid CSS conflicts

---

## 🎨 Layouts

```
src/layouts/
├── AuthLayout.vue      # For login/register pages
└── MainLayout.vue      # For authenticated pages (sidebar, header)
```

Layouts are wrapped around routes via router configuration.

---

## 📍 Router Configuration

`src/router/index.js` contains:

- **Route definitions** (paths, components, meta)
- **Navigation guards** (beforeEach, etc.)
- **Lazy loading** for code splitting
- **Permission checks** (auth, admin)

### Key Features:

- ✅ Lazy-loaded view components
- ✅ Authentication guards
- ✅ Permission-based access (requiresAdmin)
- ✅ Title management
- ✅ 404 & 403 error pages

---

## 🏪 Pinia Stores

```
src/stores/
├── auth.store.js       # User authentication & profile
├── book.store.js       # Books data & operations
├── borrow.store.js     # Borrow records & management
└── reader.store.js     # Reader/user list & management
```

### Store Structure Example

```javascript
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null);
  const token = ref(localStorage.getItem("hl_token"));
  const isLoading = ref(false);

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Actions
  async function login(email, password) {
    isLoading.value = true;
    try {
      const { data } = await api.post("/auth/login", { email, password });
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem("hl_token", token.value);
      return data;
    } finally {
      isLoading.value = false;
    }
  }

  return { user, token, isLoading, isAuthenticated, login };
});
```

### Store Best Practices

1. **Naming**: `useFeatureStore()`
2. **Separation**: One store per major feature
3. **Actions**: For async operations
4. **Computed**: For derived state
5. **Mutations**: Directly manipulate state via actions

---

## 🌐 Services

### API Service (`src/services/api.js`)

- Configured axios instance
- Request/response interceptors
- Token injection
- Error handling
- 401/403 error handling

```javascript
import api from "@/services/api";

const response = await api.get("/books");
const data = await api.post("/borrows", payload);
```

### API Wrapper Service (`src/services/api.service.js`)

- Business logic layer
- Endpoint grouping
- Error handling
- Type conversion if needed

```javascript
import apiService from "@/services/api.service";

const books = await apiService.getBooks();
const borrow = await apiService.createBorrow(bookId, readerId);
```

### Socket Service (`src/services/socket.js`)

- Socket.IO client instance
- Event listeners setup
- Real-time communication

```javascript
import socket from "@/services/socket";

socket.on("new_message", handler);
socket.emit("send_message", data);
```

---

## 🎨 Styles

### CSS File Organization

```
src/styles/
├── fonts.css          # Font imports (Google Fonts, etc.)
└── main.css           # Global styles + Tailwind directives
```

### Style Priorities

1. **Tailwind CSS utilities**: Use these for most styling
2. **Custom components**: Defined in `@layer components` in `main.css`
3. **Utilities**: Custom utility classes in `main.css`
4. **Scoped component styles**: For component-specific styling

### Example Style Implementation

```vue
<template>
  <!-- Using Tailwind utilities -->
  <div class="flex items-center gap-4 p-4 rounded-lg shadow">
    <h1 class="text-2xl font-bold text-gray-900">Title</h1>
  </div>

  <!-- Using custom component classes -->
  <div class="card">
    <p class="text-lg">Content</p>
  </div>

  <!-- Using custom component styles -->
  <button class="btn btn-primary">Click</button>
</template>

<style scoped>
/* Only if needed for component-specific needs */
.custom-style {
  /* Override or extend Tailwind utilities */
}
</style>
```

---

## 🚀 Development Workflow

### Adding a New Feature

1. **Create route** in `src/router/index.js`
2. **Create view** in `src/views/[feature]/`
3. **Create store** in `src/stores/[feature].store.js` if needed
4. **Create components** in `src/components/[feature]/`
5. **Add styles** using Tailwind + custom classes as needed
6. **Test** navigation and functionality

### Example: Adding Book Management

```
Step 1: Define route
- Add route to router/index.js
- Point to BookManagementView.vue

Step 2: Create view
- src/views/BookManagementView.vue
- Import components and stores

Step 3: Create store (if not exists)
- src/stores/book.store.js
- Define state, actions for books CRUD

Step 4: Create components
- src/components/books/BookFormModal.vue
- src/components/books/BookList.vue (if needed)

Step 5: Integrate
- Use store actions in view
- Display components
- Wire up events

Step 6: Style with Tailwind
- Use utility classes
- Add custom components if needed
```

---

## 📋 Code Standards

### Naming Conventions

| Type        | Naming            | Example                  |
| ----------- | ----------------- | ------------------------ |
| Components  | PascalCase        | `BookFormModal.vue`      |
| Views       | PascalCase + View | `BookManagementView.vue` |
| Stores      | camelCase + store | `useAuthStore()`         |
| Functions   | camelCase         | `handleSubmit()`         |
| Constants   | UPPER_SNAKE_CASE  | `MAX_FILE_SIZE`          |
| CSS classes | kebab-case        | `.btn-primary`           |

### Import Order

```javascript
// 1. Vue imports
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

// 2. External packages
import axios from "axios";

// 3. Internal services, stores
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";

// 4. Components
import HeaderComponent from "@/components/HeaderComponent.vue";
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - Use `.env.example` template
2. **Validate user input** - Check server responses
3. **HTTPS in production** - Frontend & API communication
4. **Token storage** - Keep in localStorage (or better: httpOnly cookies)
5. **XSS prevention** - Vue auto-escapes templates
6. **CSRF tokens** - If using authenticated endpoints

---

## 📊 Performance Tips

1. **Lazy load routes** - Already done in router config
2. **Code splitting** - Automatic by Vite
3. **Image optimization** - Use modern formats (WebP)
4. **Bundle analysis** - `vite-plugin-visualizer`
5. **Caching** - Leverage browser cache headers

---

## 🧪 Testing (Optional Setup)

If adding tests, follow these patterns:

```javascript
// Example test structure
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MyComponent from "@/components/MyComponent.vue";

describe("MyComponent", () => {
  it("renders properly", () => {
    const wrapper = mount(MyComponent);
    expect(wrapper.text()).toContain("Hello");
  });
});
```

---

## 📚 Resources

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vite Docs](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Pinia Getting Started](https://pinia.vuejs.org/getting-started.html)
- [Vue Router](https://router.vuejs.org/)

---

**Last Updated**: April 2026
