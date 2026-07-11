export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HOTS';
export type QuestionType = 'PG' | 'PGK' | 'BS' | 'MENJODOHKAN' | 'ISIAN';
export type QuestionSource = 'MANUAL' | 'AI_GENERATED';
export type QuestionStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
  E?: string | null;
}

export interface Question {
  id: string;
  stimulus?: string;
  soalText: string;
  soalHtml: string;
  optionsJson: QuestionOptions;
  answerKey: string;
  explanation: string;
  subtes: string;
  topic: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  status: QuestionStatus;
  source: QuestionSource;
  modelUsed?: string | null;
  skillId?: string | null;
  createdById: string;
  approvedById?: string | null;
  createdAt: string;
  
  createdBy?: { name: string; email: string };
  approvedBy?: { name: string; email: string };
}

export interface QuestionFilters {
  subtes?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
  source?: QuestionSource;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SimilarityResult {
  similarityStatus: 'SAFE' | 'WARNING' | 'BLOCKED';
  similarityScore: number;
  candidates: Array<{
    id: string;
    soalText: string;
    similarity: number;
  }>;
}
