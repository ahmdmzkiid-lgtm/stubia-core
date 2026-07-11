
export interface QuestionPackage {
  id: string;
  name: string;
  configJson: {
    subtes: string;
    totalQuestions: number;
    topicsDistribution: Record<string, number>;
    difficultyDistribution: {
      EASY: number;
      MEDIUM: number;
      HOTS: number;
    };
    includeAi: boolean;
    minSimilarityThreshold: number;
    questions: string[]; // List of resolved question IDs
  };
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdById: string;
  createdAt: string;
  createdBy?: { name: string; email: string };
}

export interface PackageGeneratorConfig {
  subtes: string;
  totalQuestions: number;
  topicsDistribution: Record<string, number>;
  difficultyDistribution: {
    EASY: number;
    MEDIUM: number;
    HOTS: number;
  };
  includeAi: boolean;
  minSimilarityThreshold: number;
}
