import { useAuthStore } from '../../../store/authStore';
import { Question, QuestionFilters, SimilarityResult } from '../types/questions.types';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const questionsApi = {
  // Get paginated list of questions
  getQuestions: async (filters: QuestionFilters): Promise<{ questions: Question[]; meta: any }> => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      const val = (filters as any)[key];
      if (val !== undefined && val !== '') {
        params.append(key, String(val));
      }
    });

    const res = await fetch(`/api/questions?${params.toString()}`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch questions');
    return result.data;
  },

  // Get details
  getQuestionById: async (id: string): Promise<Question> => {
    const res = await fetch(`/api/questions/${id}`, { headers: getHeaders() });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to fetch question');
    return result.data;
  },

  // Create manually
  createQuestion: async (questionData: Omit<Question, 'id' | 'createdById' | 'createdAt' | 'soalHtml' | 'status' | 'source'>): Promise<Question> => {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to save question');
    return result.data;
  },

  // Update question
  updateQuestion: async (id: string, questionData: Partial<Question>): Promise<Question> => {
    const res = await fetch(`/api/questions/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update question');
    return result.data;
  },

  // Approve question (academic manager)
  approveQuestion: async (id: string): Promise<Question> => {
    const res = await fetch(`/api/questions/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to approve question');
    return result.data;
  },

  // Archive question
  deleteQuestion: async (id: string): Promise<void> => {
    const res = await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete question');
  },

  // Check similarity
  checkSimilarity: async (soalText: string, excludeId?: string): Promise<SimilarityResult> => {
    const res = await fetch('/api/questions/check-similarity', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ soalText, excludeId }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to check similarity');
    return result.data;
  },

  // Get download trigger URL for Excel export
  exportQuestionsUrl: (filters: QuestionFilters): string => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      const val = (filters as any)[key];
      if (val !== undefined && val !== '') {
        params.append(key, String(val));
      }
    });
    // Append JWT token in query parameter for browser download trigger if needed, 
    // or rely on headers (but standard window.open relies on cookies or a direct download trigger fetch).
    // To handle download, we will use a Fetch trigger in the frontend button that downloads as blob.
    return `/api/questions/export?${params.toString()}`;
  },
};
