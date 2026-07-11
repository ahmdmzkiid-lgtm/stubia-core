import { useAuthStore } from '../../../store/authStore';
import { AISkill, GeneratedQuestion } from '../types/aiGenerator.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const aiGeneratorApi = {
  // Fetch active skills
  getSkills: async (): Promise<AISkill[]> => {
    const res = await fetch('/api/ai/skills', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch skills');
    return result.data;
  },

  // Create new skill
  createSkill: async (skillData: Omit<AISkill, 'id' | 'isActive' | 'createdById' | 'updatedAt' | 'formatOutput'>): Promise<AISkill> => {
    const res = await fetch('/api/ai/skills', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(skillData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create skill');
    return result.data;
  },

  // Update existing skill
  updateSkill: async (id: string, skillData: Partial<AISkill>): Promise<AISkill> => {
    const res = await fetch(`/api/ai/skills/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(skillData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update skill');
    return result.data;
  },

  // Delete skill template
  deleteSkill: async (id: string): Promise<void> => {
    const res = await fetch(`/api/ai/skills/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
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
    const res = await fetch('/api/ai/generate-questions', {
      method: 'POST',
      headers: getHeaders(),
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
  }): Promise<{ saved: number; blocked: number }> => {
    const res = await fetch('/api/ai/save-generated-questions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(saveData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to save generated questions');
    return result.data;
  },

  // Fetch generation audit logs
  getLogs: async (): Promise<any[]> => {
    const res = await fetch('/api/ai/logs', { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch logs');
    return result.data;
  },
};
