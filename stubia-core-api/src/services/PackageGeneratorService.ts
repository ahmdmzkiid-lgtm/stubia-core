import prisma from '../prisma';
import { Question, Difficulty, QuestionSource, QuestionStatus } from '@prisma/client';
import { AppError } from '../errors/AppError';

export interface PackageConfig {
  subtes: string;
  totalQuestions: number;
  topicsDistribution: Record<string, number>; // e.g. { "Aljabar": 50, "Fungsi Kuadrat": 50 }
  difficultyDistribution: {
    EASY: number; // e.g. 20
    MEDIUM: number; // e.g. 50
    HOTS: number; // e.g. 30
  };
  includeAi: boolean;
  minSimilarityThreshold: number; // e.g. 0.40 (max similarity allowed between questions in package)
}

export class PackageGeneratorService {
  /**
   * Helper to calculate trigram similarity locally in memory
   */
  private getTrigrams(str: string): Set<string> {
    const s = '  ' + str.toLowerCase().replace(/[^a-z0-9]/g, ' ') + '  ';
    const trigrams = new Set<string>();
    for (let i = 0; i < s.length - 2; i++) {
      trigrams.add(s.substring(i, i + 3));
    }
    return trigrams;
  }

  private getSimilarity(str1: string, str2: string): number {
    const set1 = this.getTrigrams(str1);
    const set2 = this.getTrigrams(str2);
    if (set1.size === 0 || set2.size === 0) return 0;

    let intersection = 0;
    set1.forEach((val) => {
      if (set2.has(val)) intersection++;
    });

    const union = set1.size + set2.size - intersection;
    return intersection / union;
  }

  async generatePackage(config: PackageConfig): Promise<Question[]> {
    const {
      subtes,
      totalQuestions,
      topicsDistribution,
      difficultyDistribution,
      includeAi,
      minSimilarityThreshold,
    } = config;

    // 1. Query candidate questions
    const where: any = {
      subtes,
      status: QuestionStatus.APPROVED, // only approved questions
    };

    if (!includeAi) {
      where.source = QuestionSource.MANUAL;
    }

    const candidates = await prisma.question.findMany({ where });

    if (candidates.length === 0) {
      throw new AppError('Tidak ada soal yang disetujui untuk subtes ini', 404, 'NOT_FOUND');
    }

    // 2. Determine target numbers for each combination
    const selectedQuestions: Question[] = [];
    const topics = Object.keys(topicsDistribution);

    // Group candidates by topic and difficulty
    const pool: Record<string, Record<string, Question[]>> = {};
    topics.forEach((t) => {
      pool[t] = {
        EASY: [],
        MEDIUM: [],
        HOTS: [],
      };
    });

    candidates.forEach((q) => {
      if (topics.includes(q.topic)) {
        pool[q.topic][q.difficulty].push(q);
      }
    });

    // Shuffle each pool to get random questions
    topics.forEach((t) => {
      (['EASY', 'MEDIUM', 'HOTS'] as Difficulty[]).forEach((d) => {
        pool[t][d] = pool[t][d].sort(() => Math.random() - 0.5);
      });
    });

    // Calculate allocation
    // We will distribute the total questions according to topic percent first, and then difficulty percent.
    const targets: Array<{ topic: string; difficulty: Difficulty; count: number }> = [];

    topics.forEach((t) => {
      const topicPct = topicsDistribution[t] / 100;
      (['EASY', 'MEDIUM', 'HOTS'] as Difficulty[]).forEach((d) => {
        const diffPct = difficultyDistribution[d] / 100;
        const count = Math.round(totalQuestions * topicPct * diffPct);
        if (count > 0) {
          targets.push({ topic: t, difficulty: d, count });
        }
      });
    });

    // Adjust target count matching totalQuestions due to rounding
    let currentTargetTotal = targets.reduce((sum, item) => sum + item.count, 0);
    if (currentTargetTotal !== totalQuestions && targets.length > 0) {
      const diff = totalQuestions - currentTargetTotal;
      // Adjust the largest target
      const largest = targets.reduce((prev, curr) => (prev.count > curr.count ? prev : curr));
      largest.count += diff;
    }

    // 3. Selection w/ similarity constraint
    for (const target of targets) {
      const targetPool = pool[target.topic][target.difficulty];
      let pickedFromTarget = 0;

      for (const candidate of targetPool) {
        if (pickedFromTarget >= target.count) break;

        // Check similarity against already selected questions in the package
        let isTooSimilar = false;
        for (const selected of selectedQuestions) {
          const sim = this.getSimilarity(candidate.soalText, selected.soalText);
          if (sim > minSimilarityThreshold) {
            isTooSimilar = true;
            break;
          }
        }

        if (!isTooSimilar) {
          selectedQuestions.push(candidate);
          pickedFromTarget++;
        }
      }

      // Fallback: If we couldn't meet target due to similarity filter, pick anyway to fill the package
      if (pickedFromTarget < target.count) {
        for (const candidate of targetPool) {
          if (pickedFromTarget >= target.count) break;
          if (!selectedQuestions.some((s) => s.id === candidate.id)) {
            selectedQuestions.push(candidate);
            pickedFromTarget++;
          }
        }
      }
    }

    // If still short (pools were empty), fill with whatever matches subtes
    if (selectedQuestions.length < totalQuestions) {
      const remainingCandidates = candidates
        .filter((c) => !selectedQuestions.some((s) => s.id === c.id))
        .sort(() => Math.random() - 0.5);

      for (const cand of remainingCandidates) {
        if (selectedQuestions.length >= totalQuestions) break;
        selectedQuestions.push(cand);
      }
    }

    return selectedQuestions.slice(0, totalQuestions);
  }
}
