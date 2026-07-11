import { useAuthStore } from '../../../store/authStore';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'academic_manager' | 'content_creator' | 'hr_ops' | 'finance_officer';
  isActive: boolean;
  createdAt: string;
}

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const usersApi = {
  listUsers: async (): Promise<AppUser[]> => {
    const res = await fetch('/api/users', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memuat daftar user');
    return result.data;
  },

  createUser: async (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<AppUser> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal membuat akun');
    return result.data;
  },

  updateUser: async (
    id: string,
    payload: Partial<{ name: string; email: string; role: string; isActive: boolean; password: string }>
  ): Promise<AppUser> => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memperbarui data user');
    return result.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal menonaktifkan akun');
  },

  restoreUser: async (id: string): Promise<void> => {
    const res = await fetch(`/api/users/${id}/restore`, { method: 'PATCH', headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal mengaktifkan kembali akun');
  },
};
