<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Tin nhắn</h1>
      <p class="text-gray-600">Giao tiếp với các thành viên khác</p>
    </div>

    <!-- Chat Container -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Users List -->
      <div class="lg:col-span-1">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Cuộc hội thoại
          </h2>
          <div class="space-y-2">
            <div
              v-for="user in onlineUsers"
              :key="user.id"
              @click="selectUser(user)"
              class="p-3 rounded-lg cursor-pointer transition-colors"
              :class="
                selectedUser?.id === user.id
                  ? 'bg-primary-100 border border-primary-500'
                  : 'hover:bg-gray-100'
              "
            >
              <p class="font-medium text-gray-900">{{ user.name }}</p>
              <p class="text-xs text-gray-500">{{ user.status }}</p>
            </div>
            <div
              v-if="onlineUsers.length === 0"
              class="text-center py-6 text-gray-500"
            >
              Không có người dùng nào trực tuyến
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="lg:col-span-3">
        <div v-if="selectedUser" class="card flex flex-col h-[600px]">
          <!-- Chat Header -->
          <div class="pb-4 border-b border-gray-200 mb-4">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ selectedUser.name }}
            </h2>
            <p class="text-sm text-gray-500">{{ selectedUser.status }}</p>
          </div>

          <!-- Messages -->
          <div
            class="flex-1 overflow-y-auto space-y-4 mb-4"
            ref="messagesContainer"
          >
            <div
              v-for="message in currentConversation"
              :key="message.id"
              class="flex"
              :class="
                message.senderId === currentUserId
                  ? 'justify-end'
                  : 'justify-start'
              "
            >
              <div
                class="max-w-xs py-2 px-4 rounded-lg"
                :class="
                  message.senderId === currentUserId
                    ? 'bg-primary-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                "
              >
                <p class="text-sm">{{ message.content }}</p>
                <p class="text-xs mt-1 opacity-70">
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="flex gap-2">
            <input
              v-model="newMessage"
              type="text"
              placeholder="Nhập tin nhắn..."
              class="form-control flex-1"
              @keyup.enter="sendMessage"
            />
            <button @click="sendMessage" class="btn btn-primary px-6">
              Gửi
            </button>
          </div>
        </div>

        <!-- No user selected -->
        <div
          v-else
          class="card flex items-center justify-center h-[600px] text-gray-500"
        >
          <p>Chọn một cuộc hội thoại để bắt đầu</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import socket, { connectSocket } from "@/services/socket";

const selectedUser = ref(null);
const newMessage = ref("");
const currentUserId = ref(localStorage.getItem("userId") || "user-1");
const onlineUsers = ref([]);
const conversations = ref({});
const messagesContainer = ref(null);

const currentConversation = computed(() => {
  if (!selectedUser.value) return [];
  return conversations.value[selectedUser.value.id] || [];
});

onMounted(() => {
  // Connect socket
  connectSocket(currentUserId.value);

  // Mock online users
  onlineUsers.value = [
    { id: "user-2", name: "Nguyễn Văn A", status: "Đang trực tuyến" },
    { id: "user-3", name: "Trần Thị B", status: "2 phút trước" },
    { id: "user-4", name: "Lê Văn C", status: "Đang trực tuyến" },
  ];

  // Initialize empty conversations
  onlineUsers.value.forEach((user) => {
    if (!conversations.value[user.id]) {
      conversations.value[user.id] = [];
    }
  });

  // Setup socket listeners
  socket.on("receive_message", (data) => {
    if (!conversations.value[data.senderId]) {
      conversations.value[data.senderId] = [];
    }
    conversations.value[data.senderId].push({
      id: Date.now(),
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date(),
    });
  });
});

const selectUser = (user) => {
  selectedUser.value = user;
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !selectedUser.value) return;

  const message = {
    id: Date.now(),
    senderId: currentUserId.value,
    content: newMessage.value,
    timestamp: new Date(),
  };

  currentConversation.value.push(message);

  // Emit via socket
  socket.emit("send_message", {
    receiverId: selectedUser.value.id,
    content: newMessage.value,
  });

  newMessage.value = "";

  // Scroll to bottom
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const formatTime = (timestamp) => {
  if (typeof timestamp === "string") {
    timestamp = new Date(timestamp);
  }
  return timestamp.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
/* Component-specific styles */
</style>
