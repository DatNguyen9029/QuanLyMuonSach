<template>
  <!-- Floating Chat Button -->
  <div class="chat-widget">
    <Transition name="chat-panel">
      <div v-if="isOpen" class="chat-panel">
        <!-- Panel Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="online-dot"></div>
            <div>
              <p class="chat-title">Hỗ trợ trực tuyến</p>
              <p class="chat-status">
                {{ isConnected ? "Đang kết nối" : "Đang kết nối lại..." }}
              </p>
            </div>
          </div>
          <button @click="isOpen = false" class="chat-close-btn">✕</button>
        </div>

        <!-- Messages -->
        <div class="chat-messages" ref="messagesContainer">
          <!-- Date separator -->
          <div class="date-separator">
            <span>Hôm nay</span>
          </div>

          <div
            v-for="msg in messages"
            :key="msg._id || msg.id"
            class="message-wrapper"
            :class="
              msg.senderId === authStore.user?._id
                ? 'message-wrapper--mine'
                : 'message-wrapper--theirs'
            "
          >
            <div v-if="msg.senderId !== authStore.user?._id" class="msg-avatar">
              {{ msg.senderName?.charAt(0) || "A" }}
            </div>
            <div
              class="message-bubble"
              :class="
                msg.senderId === authStore.user?._id
                  ? 'bubble--mine'
                  : 'bubble--theirs'
              "
            >
              <p class="msg-text">{{ msg.content }}</p>
              <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="typing-indicator">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
            <span class="typing-text">đang nhập...</span>
          </div>
        </div>

        <!-- Input area -->
        <div class="chat-input-area">
          <input
            v-model="messageInput"
            @keydown.enter.prevent="sendMessage"
            @input="emitTyping"
            placeholder="Nhập tin nhắn..."
            class="chat-input"
            :disabled="!isConnected"
          />
          <button
            @click="sendMessage"
            :disabled="!messageInput.trim() || !isConnected"
            class="send-btn"
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
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- FAB Button -->
    <button
      @click="isOpen = !isOpen"
      class="chat-fab"
      :class="{ 'chat-fab--open': isOpen }"
    >
      <Transition name="icon-flip" mode="out-in">
        <svg
          v-if="!isOpen"
          key="open"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
        <svg
          v-else
          key="close"
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
      </Transition>
      <!-- Unread badge -->
      <span v-if="unreadCount > 0 && !isOpen" class="fab-badge">{{
        unreadCount
      }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { connectSocket } from "@/services/socket";

const authStore = useAuthStore();

// ─── STATE ────────────────────────────────────────────────────────────────────
const isOpen = ref(false);
const isConnected = ref(false);
const messages = ref([]);
const messageInput = ref("");
const isTyping = ref(false);
const unreadCount = ref(0);
const messagesContainer = ref(null);

let socket = null;
let typingTimeout = null;

function upsertMessage(message) {
  if (!message) return;
  const id = message._id || message.id;
  if (id && messages.value.some((item) => (item._id || item.id) === id)) {
    return false;
  }
  messages.value.push(message);
  return true;
}

function handleConnect() {
  isConnected.value = true;
  socket?.emit("chat:load", { limit: 200 });
}

function handleDisconnect() {
  isConnected.value = false;
}

function handleNewMessage(message) {
  const inserted = upsertMessage(message);
  if (inserted && !isOpen.value) unreadCount.value += 1;
  scrollToBottom();
}

function handleTyping({ senderId }) {
  if (senderId === authStore.user?._id) return;

  isTyping.value = true;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping.value = false;
  }, 2000);
}

function handleHistory(history) {
  messages.value = Array.isArray(history) ? history : [];
  scrollToBottom();
}

function handleChatError() {
  // Không hiển thị toast ở đây để tránh nhiễu UI.
}

function attachSocketListeners() {
  if (!socket) return;
  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("new_message", handleNewMessage);
  socket.on("typing", handleTyping);
  socket.on("chat_history", handleHistory);
  socket.on("chat_error", handleChatError);
}

function detachSocketListeners() {
  if (!socket) return;
  socket.off("connect", handleConnect);
  socket.off("disconnect", handleDisconnect);
  socket.off("new_message", handleNewMessage);
  socket.off("typing", handleTyping);
  socket.off("chat_history", handleHistory);
  socket.off("chat_error", handleChatError);
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────
function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !isConnected.value || !socket) return;

  socket.emit("send_message", { content });
  messageInput.value = "";
  scrollToBottom();
}

function emitTyping() {
  if (!socket || !isConnected.value) return;
  socket.emit("typing", {});
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function formatTime(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ─── WATCHERS ─────────────────────────────────────────────────────────────────
watch(isOpen, (open) => {
  if (open) {
    unreadCount.value = 0;
    socket?.emit("chat:load", { limit: 200 });
    scrollToBottom();
  }
});

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────
onMounted(() => {
  if (!authStore.user?._id) return;
  socket = connectSocket();
  attachSocketListeners();

  if (socket.connected) {
    handleConnect();
  }
});

onUnmounted(() => {
  clearTimeout(typingTimeout);
  detachSocketListeners();
});
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* FAB */
.chat-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #0f1623;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 30px rgba(15, 22, 35, 0.4);
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #d4a843;
}
.chat-fab svg {
  width: 24px;
  height: 24px;
}
.chat-fab:hover {
  transform: scale(1.08);
  background: #1a2540;
}
.chat-fab--open {
  background: #dc2626;
  color: white;
}
.chat-fab--open:hover {
  background: #b91c1c;
}

.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #dc2626;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* Chat Panel */
.chat-panel {
  width: 340px;
  height: 480px;
  background: white;
  border-radius: 20px;
  border: 1px solid #e8e3db;
  box-shadow: 0 20px 60px rgba(15, 22, 35, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: #0f1623;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.chat-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.online-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #34c48f;
  box-shadow: 0 0 0 3px rgba(52, 196, 143, 0.3);
}
.chat-title {
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
}
.chat-status {
  color: #34c48f;
  font-size: 0.7rem;
  margin-top: 1px;
}
.chat-close-btn {
  color: #8a93a8;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
}
.chat-close-btn:hover {
  color: white;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: #e8e3db transparent;
}

.date-separator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
}
.date-separator::before,
.date-separator::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e8e3db;
}
.date-separator span {
  font-size: 0.7rem;
  color: #9ca3af;
  white-space: nowrap;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.message-wrapper--mine {
  flex-direction: row-reverse;
}
.message-wrapper--theirs {
  flex-direction: row;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f1623, #2a3a5c);
  color: #d4a843;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 220px;
}
.bubble--mine {
  background: #0f1623;
  border-radius: 16px 16px 4px 16px;
  padding: 10px 14px;
}
.bubble--theirs {
  background: #f4f2ee;
  border-radius: 16px 16px 16px 4px;
  padding: 10px 14px;
}

.msg-text {
  font-size: 0.875rem;
  line-height: 1.5;
}
.bubble--mine .msg-text {
  color: white;
}
.bubble--theirs .msg-text {
  color: #1a1a2e;
}

.msg-time {
  font-size: 0.65rem;
  margin-top: 4px;
  display: block;
}
.bubble--mine .msg-time {
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
}
.bubble--theirs .msg-time {
  color: #9ca3af;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}
.typing-dots {
  display: flex;
  gap: 4px;
}
.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: bounce 1.2s infinite;
}
.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  60%,
  100% {
    transform: none;
  }
  30% {
    transform: translateY(-6px);
  }
}
.typing-text {
  font-size: 0.72rem;
  color: #9ca3af;
}

/* Input area */
.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid #e8e3db;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  border: 1.5px solid #e8e3db;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.875rem;
  outline: none;
  color: #1a1a2e;
  transition: border-color 0.2s;
}
.chat-input:focus {
  border-color: #d4a843;
}
.chat-input::placeholder {
  color: #9ca3af;
}
.chat-input:disabled {
  background: #f4f2ee;
  cursor: not-allowed;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #0f1623;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d4a843;
  transition: all 0.2s;
  flex-shrink: 0;
}
.send-btn svg {
  width: 18px;
  height: 18px;
}
.send-btn:hover {
  background: #1a2540;
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Transitions */
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(20px);
  transform-origin: bottom right;
}

.icon-flip-enter-active,
.icon-flip-leave-active {
  transition: all 0.2s;
}
.icon-flip-enter-from,
.icon-flip-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
