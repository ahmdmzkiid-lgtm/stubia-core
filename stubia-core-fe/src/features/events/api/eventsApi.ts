import { useAuthStore } from '../../../store/authStore';
import { Event, EventType } from '../types/events.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const eventsApi = {
  getEvents: async (): Promise<Event[]> => {
    const res = await fetch('/api/events', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memuat event');
    return result.data;
  },

  createEvent: async (eventData: {
    title: string;
    type: EventType;
    startDate: string;
    endDate: string;
    description?: string;
  }): Promise<Event> => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(eventData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal membuat event');
    return result.data;
  },

  updateEvent: async (
    id: string,
    eventData: {
      title?: string;
      type?: EventType;
      startDate?: string;
      endDate?: string;
      description?: string;
    }
  ): Promise<Event> => {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(eventData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal mengubah event');
    return result.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal menghapus event');
  },
};
export default eventsApi;
