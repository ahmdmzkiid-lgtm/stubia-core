import { useAuthStore } from '../../../store/authStore';
import { QuestionPackage, PackageGeneratorConfig } from '../types/packages.types';
import { Question } from '../../questions/types/questions.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const packagesApi = {
  // Generate list of candidates
  generatePackageCandidates: async (config: PackageGeneratorConfig): Promise<Question[]> => {
    const res = await fetch('/api/packages/generate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to generate package candidates');
    return result.data;
  },

  // Save packages
  createPackage: async (name: string, configJson: any): Promise<QuestionPackage> => {
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, configJson }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create package');
    return result.data;
  },

  // Fetch list
  getPackages: async (): Promise<QuestionPackage[]> => {
    const res = await fetch('/api/packages', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch packages');
    return result.data;
  },

  // Publish to LMS
  publishPackage: async (id: string): Promise<QuestionPackage> => {
    const res = await fetch(`/api/packages/${id}/publish`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to publish package');
    return result.data;
  },

  // Excel download
  exportPackageExcel: async (id: string, name: string): Promise<void> => {
    const res = await fetch(`/api/packages/${id}/export`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken || ''}`,
      },
    });

    if (!res.ok) {
      throw new Error('Gagal mendownload paket excel dari server');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stubia-paket-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
