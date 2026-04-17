<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Tin nhắn hỗ trợ</h1>
      <p class="text-gray-600">
        {{
          authStore.isAdmin
            ? "Quản lý hội thoại giữa độc giả và quản trị viên"
            : "Độc giả chat với quản trị viên qua nút chat nổi"
        }}
      </p>
    </div>

    <div
      v-if="!authStore.isAdmin"
      class="card p-8 text-center text-gray-600 max-w-2xl mx-auto"
    >
      <p class="text-lg font-medium text-gray-800 mb-2">
        Hệ thống đã tối giản luồng chat cho độc giả.
      </p>
      <p>Vui lòng sử dụng nút chat ở góc phải dưới để liên hệ quản trị viên.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-1">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Độc giả</h2>
            <span class="text-xs text-gray-500">{{ conversations.length }}</span>
          </div>

          <div v-if="isLoadingConversations" class="text-sm text-gray-500 py-4">
            Đang tải hội thoại...
          </div>

          <div v-else class="space-y-2 max-h-[560px] overflow-y-auto">
            <button
              v-for="conversation in conversations"
              :key="conversation.reader._id"
              @click="selectConversation(conversation.reader._id)"
              class="w-full text-left p-3 rounded-lg border transition-colors"
              :class="
                selectedReaderId === conversation.reader._id
                  ? 'bg-primary-50 border-primary-400'
                  : 'border-gray-200 hover:bg-gray-50'
              "
            >
              <p class="font-medium text-gray-900 truncate">
                {{ conversation.reader.hoTen }}
              </p>
              <p class="text-xs text-gray-500 truncate">
                {{ conversation.lastMessage || "Chưa có tin nhắn" }}
              </p>
              <p class="text-[11px] text-gray-400 mt-1">
                {{ formatTime(conversation.lastMessageAt) }}
              </p>
            </button>

            <div
              v-if="!conversations.length"
              class="text-center text-sm text-gray-500 py-8"
            >
              Chưa có hội thoại nào.
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-3">
        <div v-if="selectedConversation" class="card flex flex-col h-[640px]">
          <div class="pb-4 border-b border-gray-200 mb-4">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ selectedConversation.reader.hoTen }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ isSocketConnected ? "Đang kết nối realtime" : "Mất kết nối" }}
            </p>
          </div>

          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto space-y-3 pr-2"
          >
            <div v-if="isLoadingMessages" class="text-sm text-gray-500 py-4">
              Đang tải tin nhắn...
            </div>

            <template v-else>
              <div
                v-for="message in messages"
                :key="message._id || message.id"
                class="flex"
                :class="
                  message.senderId === authStore.user?._id
                    ? 'justify-end'
                    : 'justify-start'
                "
              >
                <div
                  class="max-w-xs py-2 px-4 rounded-lg"
                  :class="
                    message.senderId === authStore.user?._id
                      ? 'bg-primary-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  "
                >
                  <p class="text-sm">{{ message.content }}</p>
                  <p class="text-xs mt-1 opacity-70">
                    {{ formatTime(message.createdAt) }}
                  </p>
                </div>
              </div>

              <div v-if="isTyping" class="text-xs text-gray-500 italic px-1">
                Độc giả đang nhập...
              </div>

              <div
                v-if="!messages.length"
                class="text-center text-sm text-gray-500 py-8"
              >
                Chưa có tin nhắn nào.
              </div>
            </template>
          </div>

          <div class="flex gap-2 mt-4">
            <input
              v-model="messageInput"
              class="form-control flex-1"
              type="text"
              placeholder="Nhập phản hồi..."
              :disabled="!isSocketConnected"
              @input="emitTyping"
              @keyup.enter="sendMessage"
            />
            <button
              class="btn btn-primary px-6"
              :disabled="!messageInput.trim() || !isSocketConnected"
              @click="sendMessage"
            >
              Gửi
            </button>
          </div>
        </div>

        <div
          v-else
          class="card h-[640px] flex items-center justify-center text-gray-500"
        >
          Chọn một độc giả để bắt đầu phản hồi.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import api from "@/services/api";
import { connectSocket } from "@/services/socket";
import { useAuthStore } from "@/stores/auth.store";

const authStore = useAuthStore();

const conversations = ref([]);
const selectedReaderId = ref(null);
const messages = ref([]);
const messageInput = ref("");
const isTyping = ref(false);
const isSocketConnected = ref(false);
const isLoadingConversations = ref(false);
const isLoadingMessages = ref(false);
const messagesContainer = ref(null);

let socket = null;
let typingTimeout = null;

const selectedConversation = computed(() =>
  conversations.value.find((item) => item.reader._id === selectedReaderId.value),
);

function normalizeReaderId(input) {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (typeof input === "object" && input._id) return String(input._id);
  return String(input);
}

function normalizeMessage(message = {}) {
  return {
    _id: message._id || message.id || null,
    content: message.content || "",
    senderId: message.senderId || null,
    senderName: message.senderName || "Người dùng",
    senderRole: message.senderRole || null,
    receiverId: message.receiverId || null,
    receiverName: message.receiverName || null,
    receiverRole: message.receiverRole || null,
    createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
  };
}

function sortConversations() {
  conversations.value.sort((a, b) => {
    const at = new Date(a.lastMessageAt || 0).getTime();
    const bt = new Date(b.lastMessageAt || 0).getTime();
    return bt - at;
  });
}

function getReaderIdFromMessage(message) {
  if (message.senderRole === "user") return message.senderId;
  if (message.receiverRole === "user") return message.receiverId;
  return null;
}

function upsertConversationFromMessage(message) {
  const readerId = getReaderIdFromMessage(message);
  if (!readerId) return;

  const readerName =
    message.senderRole === "user"
      ? message.senderName
      : message.receiverName || selectedConversation.value?.reader.hoTen || "Độc giả";
  const messageTime = message.createdAt || new Date().toISOString();
  const index = conversations.value.findIndex((item) => item.reader._id === readerId);

  if (index >= 0) {
    conversations.value[index] = {
      ...conversations.value[index],
      lastMessage: message.content,
      lastMessageAt: messageTime,
    };
  } else {
    conversations.value.unshift({
      reader: { _id: readerId, hoTen: readerName, avatar: null },
      lastMessage: message.content,
      lastMessageAt: messageTime,
    });
  }

  sortConversations();
}

function upsertMessageInCurrentThread(message) {
  const id = message._id || message.id;
  if (id && messages.value.some((item) => (item._id || item.id) === id)) return;
  messages.value.push(message);
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function fetchConversations() {
  isLoadingConversations.value = true;
  try {
    const { data } = await api.get("/chat/conversations");
    conversations.value = Array.isArray(data?.data) ? data.data : [];
    sortConversations();

    if (!selectedReaderId.value && conversations.value.length) {
      await selectConversation(conversations.value[0].reader._id);
    }
  } finally {
    isLoadingConversations.value = false;
  }
}

async function fetchHistory(readerId) {
  const normalizedReaderId = normalizeReaderId(readerId);
  if (!normalizedReaderId) return;

  isLoadingMessages.value = true;
  messages.value = [];

  try {
    const { data } = await api.get("/chat/history", {
      params: {
        readerId: normalizedReaderId,
        limit: 300,
        _t: Date.now(),
      },
    });
    messages.value = Array.isArray(data?.data)
      ? data.data.map(normalizeMessage)
      : [];
    await scrollToBottom();
  } catch (err) {
    messages.value = [];
  } finally {
    isLoadingMessages.value = false;
  }
}

function handleConnect() {
  isSocketConnected.value = true;
}

function handleDisconnect() {
  isSocketConnected.value = false;
}

function handleNewMessage(rawMessage) {
  const message = normalizeMessage(rawMessage);
  const readerId = getReaderIdFromMessage(message);
  if (!readerId) return;

  upsertConversationFromMessage(message);

  if (selectedReaderId.value === readerId) {
    upsertMessageInCurrentThread(message);
    scrollToBottom();
  }
}

function handleTyping(payload = {}) {
  if (payload.senderRole !== "user") return;
  if (!selectedReaderId.value || payload.readerId !== selectedReaderId.value) return;

  isTyping.value = true;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping.value = false;
  }, 1800);
}

function attachSocketListeners() {
  if (!socket) return;
  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("new_message", handleNewMessage);
  socket.on("typing", handleTyping);
}

function detachSocketListeners() {
  if (!socket) return;
  socket.off("connect", handleConnect);
  socket.off("disconnect", handleDisconnect);
  socket.off("new_message", handleNewMessage);
  socket.off("typing", handleTyping);
}

async function selectConversation(readerId) {
  const normalizedReaderId = normalizeReaderId(readerId);
  if (!normalizedReaderId) return;
  selectedReaderId.value = normalizedReaderId;
  isTyping.value = false;
  await fetchHistory(normalizedReaderId);
}

function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !selectedReaderId.value || !socket || !isSocketConnected.value) return;

  socket.emit("send_message", {
    receiverId: selectedReaderId.value,
    content,
  });
  messageInput.value = "";
}

function emitTyping() {
  if (!socket || !isSocketConnected.value || !selectedReaderId.value) return;
  socket.emit("typing", { receiverId: selectedReaderId.value });
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(async () => {
  if (!authStore.isAdmin) return;
  await fetchConversations();

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
