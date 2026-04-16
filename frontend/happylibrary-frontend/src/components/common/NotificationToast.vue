<template>
  <Transition
    name="toast-slide"
    @before-enter="beforeEnter"
    @enter="enter"
    @after-leave="afterLeave"
  >
    <div
      v-if="visible"
      class="toast-notification fixed top-4 right-4 z-[9999] shadow-2xl border-l-4 shadow-slate-900/25 backdrop-blur-sm"
      :class="toastClasses"
    >
      <div class="flex items-start gap-3 p-4 pr-6">
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
          >
            <svg class="w-6 h-6" fill="currentColor" :class="iconClasses">
              <path
                v-if="type === 'success'"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                v-else-if="type === 'error'"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
              <path
                v-else-if="type === 'warning'"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333 .192 3 1.732 3z"
              />
              <path
                v-else
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-900 text-sm leading-tight">
            {{ title }}
          </p>
          <p class="text-slate-600 text-sm mt-0.5 leading-relaxed">
            {{ message }}
          </p>
        </div>

        <!-- Close button -->
        <button
          @click="dismiss"
          class="flex-shrink-0 ml-2 p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/50 transition-all"
          title="Đóng"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["dismiss"]);

const visible = ref(false);
const timeout = ref(null);
const type = ref(props.notification.type || "info");
const title = ref(props.notification.title || "Thông báo");
const message = ref(props.notification.message || "");

const toastClasses = computed(() => ({
  "border-green-500 bg-green-50/90": type.value === "success",
  "border-red-500 bg-red-50/90": type.value === "error",
  "border-orange-500 bg-orange-50/90": type.value === "warning",
  "border-blue-500 bg-blue-50/90":
    type.value === "info" || type.value === "borrow_update",
  "border-purple-500 bg-purple-50/90": type.value === "chat_new",
}));

const iconClasses = computed(() => ({
  "text-green-600": type.value === "success",
  "text-red-600": type.value === "error",
  "text-orange-600": type.value === "warning",
  "text-blue-600": type.value === "info" || type.value === "borrow_update",
  "text-purple-600": type.value === "chat_new",
}));

watch(
  () => props.notification,
  (newNotif) => {
    type.value = newNotif.type || "info";
    title.value = newNotif.title;
    message.value = newNotif.message;
    visible.value = true;
    startTimer();
  },
  { immediate: true },
);

function startTimer() {
  if (timeout.value) clearTimeout(timeout.value);

  // Auto dismiss: error 10s, warning 7s, others 5s
  const duration =
    type.value === "error" ? 10000 : type.value === "warning" ? 7000 : 5000;
  timeout.value = setTimeout(() => {
    dismiss();
  }, duration);
}

function dismiss() {
  visible.value = false;
  emit("dismiss");
}

function beforeEnter(el) {
  el.style.opacity = "0";
  el.style.transform = "translateX(100%)";
}

function enter(el) {
  const animation = el.animate(
    [
      { opacity: 0, transform: "translateX(100%)" },
      { opacity: 1, transform: "translateX(0)" },
    ],
    { duration: 300, easing: "ease-out" },
  );
  animation.onfinish = () => (el.style.opacity = "1");
}

function afterLeave(el) {
  el.style.opacity = "0";
}

defineExpose({ dismiss });
</script>

<style scoped>
.toast-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
