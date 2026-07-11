import { useAuthStore } from '../../../store/authStore';
import { ChatRoom, ChatMessage } from '../types/chat.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const chatApi = {
  getRooms: async (): Promise<ChatRoom[]> => {
    const res = await fetch('/api/chat/rooms', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch chat rooms');
    return result.data;
  },

  getMessages: async (roomId: string): Promise<ChatMessage[]> => {
    const res = await fetch(`/api/chat/rooms/${roomId}/messages`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch messages');
    return result.data;
  },

  sendMessage: async (roomId: string, content: string): Promise<ChatMessage> => {
    const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to send message');
    return result.data;
  },

  getActiveUsers: async (): Promise<Array<{ id: string; name: string; email: string; role: string }>> => {
    const res = await fetch('/api/chat/users', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch users');
    return result.data;
  },

  initiatePersonalChat: async (targetUserId: string): Promise<ChatRoom> => {
    const res = await fetch('/api/chat/personal', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetUserId }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to initiate personal chat');
    return result.data;
  },

  updateMessage: async (messageId: string, content: string): Promise<ChatMessage> => {
    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to edit message');
    return result.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete message');
  },
};
export default chatApi;
