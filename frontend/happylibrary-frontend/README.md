# happylibrary-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

src/
├── assets/
│ └── styles/
│ └── main.css # Tailwind directives + CSS variables
│
├── components/
│ ├── common/
│ │ ├── AppBadge.vue
│ │ ├── AppModal.vue
│ │ └── AppDataTable.vue
│ ├── dashboard/
│ │ └── StatCard.vue
│ ├── books/
│ │ └── BookFormModal.vue
│ ├── borrows/
│ │ ├── BorrowDetailModal.vue
│ │ └── FineCalculatorModal.vue
│ └── chat/
│ └── ChatWidget.vue
│
├── layouts/
│ ├── AuthLayout.vue
│ └── MainLayout.vue # ← Code bên dưới
│
├── views/
│ ├── auth/
│ │ ├── LoginView.vue
│ │ └── RegisterView.vue
│ ├── DashboardView.vue
│ ├── BookManagementView.vue
│ ├── BorrowManagementView.vue # ← Code bên dưới
│ ├── ReaderManagementView.vue
│ └── ChatView.vue
│
├── stores/
│ ├── auth.store.js
│ ├── book.store.js
│ ├── borrow.store.js
│ └── reader.store.js
│
├── services/
│ ├── api.js # Axios instance + interceptors
│ ├── auth.service.js
│ ├── book.service.js
│ └── borrow.service.js
│
├── router/
│ └── index.js # ← Route guards phân quyền
│
└── main.js
