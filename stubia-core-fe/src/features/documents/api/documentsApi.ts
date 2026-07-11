import { useAuthStore } from '../../../store/authStore';
import { Document, DocumentAccessLog, VisionMission, Objective } from '../types/documents.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const documentsApi = {
  // Document Drive
  getDocuments: async (folderPath: string): Promise<Document[]> => {
    const res = await fetch(`/api/documents?folderPath=${folderPath}`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memuat berkas');
    return result.data;
  },

  uploadDocument: async (data: {
    name: string;
    folderPath: string;
    filename: string;
    fileType: string;
    fileData: string; // base64 representation
  }): Promise<Document> => {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal mengunggah dokumen');
    return result.data;
  },

  logDocumentAccess: async (id: string, action: 'view' | 'download'): Promise<void> => {
    await fetch(`/api/documents/${id}/log`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    });
  },

  getDocumentAccessLogs: async (): Promise<DocumentAccessLog[]> => {
    const res = await fetch('/api/documents/logs', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memuat log audit');
    return result.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal menghapus dokumen');
  },

  // Vision Mission
  getVisionMission: async (): Promise<VisionMission> => {
    const res = await fetch('/api/documents/vision-mission', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memuat visi misi');
    return result.data;
  },

  updateVisionMission: async (data: VisionMission): Promise<VisionMission> => {
    const res = await fetch('/api/documents/vision-mission', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal mengubah visi misi');
    return result.data;
  },

  // OKRs
  getObjectives: async (): Promise<Objective[]> => {
    const res = await fetch('/api/documents/objectives', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal memuat data OKR');
    return result.data;
  },

  createObjective: async (data: {
    title: string;
    targetDate: string;
    keyResults: Array<{ title: string; targetVal: number; unit?: string }>;
  }): Promise<Objective> => {
    const res = await fetch('/api/documents/objectives', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal membuat Objective OKR');
    return result.data;
  },

  updateKeyResult: async (krId: string, currentVal: number): Promise<void> => {
    const res = await fetch(`/api/documents/key-results/${krId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ currentVal }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Gagal mengubah kemajuan key result');
  },
};
export default documentsApi;
