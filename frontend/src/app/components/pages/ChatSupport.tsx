import { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { mockChatConversations, mockChatMessages, mockUsers, type ChatMessage } from '../../data/mockData';

export function ChatSupport() {
  const [conversations] = useState(mockChatConversations);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(conversations[0]?.userId || null);
  const [messages, setMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');

  const selectedConversation = conversations.find(c => c.userId === selectedUserId);
  const currentMessages = selectedUserId ? messages[selectedUserId] || [] : [];
  const selectedUser = mockUsers.find(u => u.maDocGia === selectedUserId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: selectedUserId,
      userName: 'Admin',
      message: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'admin'
    };

    setMessages({
      ...messages,
      [selectedUserId]: [...(messages[selectedUserId] || []), message]
    });
    setNewMessage('');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chat Hỗ trợ</h1>
        <p className="mt-1 text-gray-600">Trò chuyện và hỗ trợ độc giả</p>
      </div>

      {/* Chat Interface */}
      <div className="grid h-[calc(100vh-200px)] grid-cols-3 gap-4">
        {/* Conversations List */}
        <div className="col-span-1 rounded-lg border bg-white shadow">
          <div className="border-b p-4">
            <h3 className="font-semibold">Tin nhắn</h3>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="space-y-1 p-2">
              {conversations.map((conv) => {
                const user = mockUsers.find(u => u.maDocGia === conv.userId);
                return (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUserId(conv.userId)}
                    className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                      selectedUserId === conv.userId
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={user?.avatar} alt={conv.userName} />
                      <AvatarFallback>{conv.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{conv.userName}</p>
                        {conv.unread > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-gray-600">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(conv.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="col-span-2 flex flex-col rounded-lg border bg-white shadow">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b p-4">
                <Avatar>
                  <AvatarImage src={selectedUser?.avatar} alt={selectedConversation.userName} />
                  <AvatarFallback>{selectedConversation.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedConversation.userName}</p>
                  <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p
                          className={`mt-1 text-xs ${
                            msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1"
                  />
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <MessageCircle className="h-16 w-16 mb-4" />
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
