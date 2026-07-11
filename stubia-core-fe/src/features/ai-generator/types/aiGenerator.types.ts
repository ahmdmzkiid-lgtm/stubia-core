
export interface AISkill {
  id: string;
  namaSkill: string;
  subtes: string;
  topikCakupanJson: string[];
  instruksiSoal: string;
  formatOutput: string;
  contohSoalJson: any[];
  larangan?: string;
  versi: string;
  isActive: boolean;
  createdById: string;
  updatedAt: string;
}

export interface GenerateConfig {
  subtes: string;
  topik: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HOTS';
  tipe: 'PG' | 'PGK' | 'BS' | 'ISIAN';
  jumlah: number;
}

export interface GeneratedQuestion {
  stimulus?: string | null;
  soal: string;
  opsi: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string | null;
  };
  kunci_jawaban: string;
  pembahasan: string;
  subtes: string;
  topik: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HOTS';
  tipe: 'PG' | 'PGK' | 'BS' | 'ISIAN';
  
  // Similarity status added by backend check
  similarityStatus: 'SAFE' | 'WARNING' | 'BLOCKED';
  similarityScore: number;
  candidates?: Array<{
    id: string;
    soalText: string;
    similarity: number;
  }>;
}

export interface AIGenerationLog {
  id: string;
  userId: string;
  skillId: string;
  modelUsed: string;
  configJson: GenerateConfig;
  questionsGenerated: number;
  questionsSaved: number;
  questionsBlocked: number;
  tokensUsed?: number;
  costEstimateUsd?: number;
  durationMs?: number;
  createdAt: string;
  user?: { name: string; email: string };
  skill?: { namaSkill: string };
}
