import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AIProviderService } from '../services/AIProviderService';
import { AISkillService } from '../services/AISkillService';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Difficulty, QuestionType, QuestionSource, QuestionStatus } from '@prisma/client';

const aiService = new AIProviderService();
const skillService = new AISkillService();

// Helper to strip HTML tags for plain text comparison
const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

// Helper function to query pg_trgm similarity
const checkQuestionSimilarity = async (soalText: string) => {
  const plainText = stripHtml(soalText);
  if (plainText.length < 30) {
    return [];
  }

  // Execute raw query for trigram similarity
  const candidates = await prisma.$queryRaw<Array<{ id: string; soal_text: string; sim: number }>>`
    SELECT id, soal_text, similarity(soal_text, ${plainText}) AS sim
    FROM questions
    WHERE similarity(soal_text, ${plainText}) > 0.4
    ORDER BY sim DESC
    LIMIT 5
  `;

  return candidates.map((c) => ({
    id: c.id,
    soalText: c.soal_text,
    similarity: c.sim,
  }));
};

export const generateQuestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  try {
    const { skillId, config, model } = req.body;

    if (!skillId || !config || !config.subtes || !config.topik || !config.difficulty || !config.tipe || !config.jumlah) {
      throw new AppError('Parameter request tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const skill = await skillService.getSkillById(skillId);

    // Call AI Generation Service
    const generationResult = await aiService.generateQuestions(skill, {
      subtes: config.subtes,
      topik: config.topik,
      difficulty: config.difficulty,
      tipe: config.tipe,
      jumlah: config.jumlah,
      model,
    });

    const processedQuestions = [];
    let blockedCount = 0;
    let warningCount = 0;
    let safeCount = 0;

    // Check similarity for each generated question
    for (const q of generationResult.questions) {
      const similarityCandidates = await checkQuestionSimilarity(q.soal);
      
      let status: 'SAFE' | 'WARNING' | 'BLOCKED' = 'SAFE';
      const topSimilarity = similarityCandidates.length > 0 ? similarityCandidates[0].similarity : 0;

      if (topSimilarity > 0.70) {
        status = 'BLOCKED';
        blockedCount++;
      } else if (topSimilarity >= 0.40) {
        status = 'WARNING';
        warningCount++;
      } else {
        safeCount++;
      }

      processedQuestions.push({
        ...q,
        similarityStatus: status,
        similarityScore: topSimilarity,
        candidates: similarityCandidates,
      });
    }

    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        questions: processedQuestions,
        meta: {
          durationMs,
          tokensUsed: generationResult.tokensUsed,
          costEstimateUsd: generationResult.costEstimate,
          summary: {
            blocked: blockedCount,
            warning: warningCount,
            safe: safeCount,
            total: processedQuestions.length,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const saveGeneratedQuestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { questions, skillId, config, modelUsed, tokensUsed, costEstimateUsd, durationMs } = req.body;

    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Tidak ada soal yang dipilih untuk disimpan', 400, 'VALIDATION_ERROR');
    }

    let savedCount = 0;
    let blockedCount = 0;

    const creatorId = req.user.userId;

    for (const q of questions) {
      // Re-validate similarity (anti-bypass validation)
      const similarityCandidates = await checkQuestionSimilarity(q.soal);
      const topSimilarity = similarityCandidates.length > 0 ? similarityCandidates[0].similarity : 0;

      // academic_manager and super_admin can override blocked questions, content_creator cannot
      if (topSimilarity > 0.70 && req.user.role === 'content_creator') {
        blockedCount++;
        continue; // skip
      }

      // Map enums
      const mappedDifficulty = q.difficulty as Difficulty;
      const mappedType = q.tipe as QuestionType;

      await prisma.question.create({
        data: {
          stimulus: q.stimulus || '',
          soalText: q.soal,
          soalHtml: `<p>${q.soal}</p>`,
          optionsJson: q.opsi,
          answerKey: q.kunci_jawaban,
          explanation: q.pembahasan,
          subtes: q.subtes,
          topic: q.topik,
          difficulty: mappedDifficulty,
          type: mappedType,
          status: QuestionStatus.DRAFT,
          source: QuestionSource.AI_GENERATED,
          modelUsed: modelUsed || 'gemini-2.5-flash',
          skillId: skillId || null,
          createdById: creatorId,
        },
      });

      savedCount++;
    }

    // Insert generation log
    if (skillId) {
      await prisma.aIGenerationLog.create({
        data: {
          userId: creatorId,
          skillId,
          modelUsed: modelUsed || 'gemini-2.5-flash',
          configJson: config || {},
          questionsGenerated: questions.length,
          questionsSaved: savedCount,
          questionsBlocked: blockedCount,
          tokensUsed: tokensUsed || 0,
          costEstimateUsd: costEstimateUsd || 0,
          durationMs: durationMs || 0,
        },
      });

      // Insert debit payroll log or finance ledger log for AI Cost if cost is higher than 0
      if (costEstimateUsd && costEstimateUsd > 0) {
        // Find super admin or default recorder
        const recorder = await prisma.user.findFirst({
          where: { role: 'super_admin' }
        });
        if (recorder) {
          await prisma.cashflowEntry.create({
            data: {
              type: 'debit',
              amount: costEstimateUsd,
              category: 'AI_COST',
              description: `AI Cost estimate for generating ${questions.length} questions using ${modelUsed || 'gemini-2.5-flash'}.`,
              refType: 'ai_generation',
              recordedById: recorder.id,
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Proses penyimpanan selesai',
      data: {
        saved: savedCount,
        blocked: blockedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// CRUD for AI Skills
export const getSkills = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const skills = await skillService.getAllSkills();
    res.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    next(error);
  }
};

export const createSkill = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    
    const { namaSkill, subtes, topikCakupanJson, instruksiSoal, contohSoalJson, larangan, versi } = req.body;
    
    const newSkill = await skillService.createSkill({
      namaSkill,
      subtes,
      topikCakupanJson,
      instruksiSoal,
      contohSoalJson,
      larangan,
      versi,
      createdById: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Template skill prompt berhasil dibuat',
      data: newSkill,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSkill = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { namaSkill, subtes, topikCakupanJson, instruksiSoal, contohSoalJson, larangan, versi } = req.body;

    const updated = await skillService.updateSkill(id, {
      namaSkill,
      subtes,
      topikCakupanJson,
      instruksiSoal,
      contohSoalJson,
      larangan,
      versi,
    });

    res.json({
      success: true,
      message: 'Template skill prompt berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await skillService.deleteSkill(id);
    res.json({
      success: true,
      message: 'Template skill prompt dinonaktifkan',
    });
  } catch (error) {
    next(error);
  }
};

// AI Generation Logs
export const getLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.aIGenerationLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        skill: { select: { namaSkill: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
