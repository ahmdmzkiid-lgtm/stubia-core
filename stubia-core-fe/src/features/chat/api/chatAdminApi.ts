import { useAuthStore } from '../../../store/authStore';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const chatAdminApi = {
  addParticipant: async (roomId: string, userId: string) => {
    const res = await fetch(`/api/chat/rooms/${roomId}/participants`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal menambahkan peserta');
    return result.data;
  },

  removeParticipant: async (roomId: string, targetUserId: string) => {
    const res = await fetch(`/api/chat/rooms/${roomId}/participants/${targetUserId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal menghapus peserta');
  },

  getRoomDetail: async (roomId: string) => {
    const res = await fetch(`/api/chat/rooms/${roomId}`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memuat detail room');
    return result.data;
  },
};
