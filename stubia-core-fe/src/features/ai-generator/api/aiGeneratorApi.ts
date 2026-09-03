import { authFetch } from '../../../utils/apiClient';
import { AISkill, GeneratedQuestion } from '../types/aiGenerator.types';

export const aiGeneratorApi = {
  // Fetch active skills
  getSkills: async (): Promise<AISkill[]> => {
    const res = await authFetch('/api/ai/skills');
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch skills');
    return result.data;
  },

  // Create new skill
  createSkill: async (skillData: Omit<AISkill, 'id' | 'isActive' | 'createdById' | 'updatedAt' | 'formatOutput'>): Promise<AISkill> => {
    const res = await authFetch('/api/ai/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create skill');
    return result.data;
  },

  // Update existing skill
  updateSkill: async (id: string, skillData: Partial<AISkill>): Promise<AISkill> => {
    const res = await authFetch(`/api/ai/skills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(skillData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update skill');
    return result.data;
  },

  // Delete skill template
  deleteSkill: async (id: string): Promise<void> => {
    const res = await authFetch(`/api/ai/skills/${id}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete skill');
  },

  // Trigger questions generation
  generateQuestions: async (
    skillId: string,
    config: {
      subtes: string;
      topik: string[];
      difficulty: string;
      tipe: string;
      jumlah: number;
    },
    model?: string
  ): Promise<{
    questions: GeneratedQuestion[];
    meta: {
      durationMs: number;
      tokensUsed: number;
      costEstimateUsd: number;
      summary: { blocked: number; warning: number; safe: number; total: number };
    };
  }> => {
    const res = await authFetch('/api/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ skillId, config, model }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'AI Generation failed');
    return result.data;
  },

  // Save selected questions
  saveQuestions: async (saveData: {
    questions: Partial<GeneratedQuestion>[];
    skillId?: string;
    config?: any;
    modelUsed?: string;
    tokensUsed?: number;
    costEstimateUsd?: number;
    durationMs?: number;
    packageName?: string;
  }): Promise<{ saved: number; blocked: number }> => {
    const res = await authFetch('/api/ai/save-generated-questions', {
      method: 'POST',
      body: JSON.stringify(saveData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to save generated questions');
    return result.data;
  },

  // Fetch generation audit logs
  getLogs: async (): Promise<any[]> => {
    const res = await authFetch('/api/ai/logs');
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch logs');
    return result.data;
  },

  // Export questions as TKA 14-column Excel
  exportTkaExcel: async (questions: Partial<GeneratedQuestion>[], fileName?: string): Promise<void> => {
    const res = await authFetch('/api/ai/export-tka-excel', {
      method: 'POST',
      body: JSON.stringify({ questions, fileName }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Gagal mengekspor file Excel TKA');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    a.download = fileName ? `${fileName}.xlsx` : `TKA_BINDO_TRYOUT_${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
