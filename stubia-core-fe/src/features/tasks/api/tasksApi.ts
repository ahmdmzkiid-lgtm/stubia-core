import { useAuthStore } from '../../../store/authStore';
import { Task, TaskStatus, HRAnalyticsData } from '../types/tasks.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const tasksApi = {
  // Fetch tasks
  getTasks: async (filters?: { status?: TaskStatus; assigneeId?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);

    const res = await fetch(`/api/tasks?${params.toString()}`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch tasks');
    return result.data;
  },

  // Create new task
  createTask: async (taskData: { title: string; description: string; assigneeId: string; deadline: string }): Promise<Task> => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create task');
    return result.data;
  },

  updateTaskStatus: async (
    id: string,
    status: TaskStatus,
    proof?: { name: string; type: string; data: string },
    feedback?: string
  ): Promise<Task> => {
    const res = await fetch(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        status,
        proofName: proof?.name,
        proofType: proof?.type,
        proofData: proof?.data,
        feedback,
      }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update task status');
    return result.data;
  },

  // Time logs
  startTaskTimer: async (id: string): Promise<any> => {
    const res = await fetch(`/api/tasks/${id}/time-log/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to start timer');
    return result.data;
  },

  stopTaskTimer: async (id: string): Promise<any> => {
    const res = await fetch(`/api/tasks/${id}/time-log/stop`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to stop timer');
    return result.data;
  },

  // HR Analytics
  getHRAnalytics: async (): Promise<HRAnalyticsData> => {
    const res = await fetch('/api/tasks/analytics/hr', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch analytics');
    return result.data;
  },

  // Fetch writers (active users in the database)
  getWriters: async (): Promise<Array<{ id: string; name: string; email: string }>> => {
    const res = await fetch('/api/users', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch writers');
    return (result.data || [])
      .filter((u: any) => u.isActive)
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }));
  },
};
