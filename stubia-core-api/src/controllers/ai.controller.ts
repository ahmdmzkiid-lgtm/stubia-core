import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AIProviderService } from '../services/AIProviderService';
import { AISkillService } from '../services/AISkillService';
import { TKAExportService } from '../services/TKAExportService';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Difficulty, QuestionType, QuestionSource, QuestionStatus } from '@prisma/client';

const aiService = new AIProviderService();
const skillService = new AISkillService();
const tkaExportService = new TKAExportService();

// Helper to strip HTML tags for plain text comparison
const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

// Helper function to query pg_trgm similarity on BOTH Soal and Stimulus
const checkQuestionSimilarity = async (soalText: string, stimulusText?: string | null) => {
  const plainSoal = stripHtml(soalText || '');
  const plainStimulus = stripHtml(stimulusText || '');

  if (plainSoal.length < 20 && plainStimulus.length < 30) {
    return [];
  }

  const candidates: Array<{ id: string; soalText: string; similarity: number; matchType: string }> = [];

  // 1. Check Stimulus similarity if stimulus is present
  if (plainStimulus.length >= 30) {
    const stimulusMatches = await prisma.$queryRaw<Array<{ id: string; soal_text: string; stimulus: string | null; sim: number }>>`
      SELECT id, soal_text, stimulus, similarity(stimulus, ${plainStimulus}) AS sim
      FROM questions
      WHERE stimulus IS NOT NULL AND LENGTH(stimulus) > 20 AND similarity(stimulus, ${plainStimulus}) > 0.35
      ORDER BY sim DESC
      LIMIT 5
    `;

    for (const m of stimulusMatches) {
      candidates.push({
        id: m.id,
        soalText: m.soal_text ? `[Stimulus Mirip] ${m.soal_text}` : `[Stimulus Mirip: "${(m.stimulus || '').substring(0, 70)}..."]`,
        similarity: m.sim,
        matchType: 'Stimulus',
      });
    }
  }

  // 2. Check Soal similarity
  if (plainSoal.length >= 20) {
    const soalMatches = await prisma.$queryRaw<Array<{ id: string; soal_text: string; sim: number }>>`
      SELECT id, soal_text, similarity(soal_text, ${plainSoal}) AS sim
      FROM questions
      WHERE similarity(soal_text, ${plainSoal}) > 0.40
      ORDER BY sim DESC
      LIMIT 5
    `;

    for (const m of soalMatches) {
      const existing = candidates.find((c) => c.id === m.id);
      if (existing) {
        if (m.sim > existing.similarity) {
          existing.similarity = m.sim;
          existing.matchType = 'Stimulus & Soal';
        }
      } else {
        candidates.push({
          id: m.id,
          soalText: m.soal_text,
          similarity: m.sim,
          matchType: 'Soal',
        });
      }
    }
  }

  candidates.sort((a, b) => b.similarity - a.similarity);
  return candidates.slice(0, 5);
};

export const generateQuestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  try {
    const { skillId, config, model } = req.body;

    if (!skillId || !config || !config.subtes || !config.topik || !config.difficulty || !config.jumlah) {
      throw new AppError('Parameter request tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const parsedJumlah = parseInt(config.jumlah) || 5;
    if (parsedJumlah < 1 || parsedJumlah > 50) {
      throw new AppError('Jumlah soal harus berada di antara 1 dan 50', 400, 'VALIDATION_ERROR');
    }

    const skill = await skillService.getSkillById(skillId);

    // Call AI Generation Service
    const generationResult = await aiService.generateQuestions(skill, {
      subtes: config.subtes,
      topik: config.topik,
      materi: config.materi,
      materiList: config.materiList,
      difficulty: config.difficulty,
      difficultyDistribution: config.difficultyDistribution,
      tipe: config.tipe,
      tipes: config.tipes,
      typesDistribution: config.typesDistribution,
      jumlah: parsedJumlah,
      reuseStimulus: config.reuseStimulus,
      questionsPerStimulus: config.questionsPerStimulus,
      includeImagePrompts: config.includeImagePrompts,
      model,
    });

    const processedQuestions = [];
    let blockedCount = 0;
    let warningCount = 0;
    let safeCount = 0;

    // Check similarity for each generated question (Checking both Soal and Stimulus)
    for (const q of generationResult.questions) {
      const similarityCandidates = await checkQuestionSimilarity(q.soal, q.stimulus);
      
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
    const { questions, skillId, config, modelUsed, tokensUsed, costEstimateUsd, durationMs, packageName } = req.body;

    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Tidak ada soal yang dipilih untuk disimpan', 400, 'VALIDATION_ERROR');
    }

    let savedCount = 0;
    let blockedCount = 0;

    const creatorId = req.user.userId;
    const finalPackageName = packageName && typeof packageName === 'string' && packageName.trim() ? packageName.trim() : null;

    for (const q of questions) {
      // Re-validate similarity on both Soal and Stimulus (anti-bypass validation)
      const similarityCandidates = await checkQuestionSimilarity(q.soal, q.stimulus);
      const topSimilarity = similarityCandidates.length > 0 ? similarityCandidates[0].similarity : 0;

      // academic_manager and super_admin can override blocked questions, content_creator cannot
      if (topSimilarity > 0.70 && req.user.role === 'content_creator') {
        blockedCount++;
        continue; // skip
      }

      // Map enums
      const mappedDifficulty = q.difficulty as Difficulty;
      const mappedType = q.tipe as QuestionType;

      const defaultModel = process.env.AI_DEFAULT_MODEL || 'opus-4.6';

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
          modelUsed: modelUsed || defaultModel,
          skillId: skillId || null,
          packageName: finalPackageName || q.packageName || null,
          createdById: creatorId,
        },
      });

      savedCount++;
    }

    const defaultModel = process.env.AI_DEFAULT_MODEL || 'opus-4.6';

    // Insert generation log
    if (skillId) {
      // Safely clamp integers to PostgreSQL INT4 range (max 2,147,483,647) to prevent conversion errors
      const safeDurationMs = Math.min(Math.max(0, Math.round(Number(durationMs) || 0)), 2147483647);
      const safeTokensUsed = Math.min(Math.max(0, Math.round(Number(tokensUsed) || 0)), 2147483647);

      await prisma.aIGenerationLog.create({
        data: {
          userId: creatorId,
          skillId,
          modelUsed: modelUsed || defaultModel,
          configJson: config || {},
          questionsGenerated: questions.length,
          questionsSaved: savedCount,
          questionsBlocked: blockedCount,
          tokensUsed: safeTokensUsed,
          costEstimateUsd: typeof costEstimateUsd === 'number' ? costEstimateUsd : 0,
          durationMs: safeDurationMs,
        },
      });
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

// Export generated questions as TKA Excel
export const exportTkaExcel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { questions, fileName } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Tidak ada soal untuk di-export', 400, 'VALIDATION_ERROR');
    }

    const workbook = await tkaExportService.exportToExcel(questions, fileName);

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const exportFileName = fileName || `TKA_BINDO_TRYOUT_${dateStr}`;

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportFileName}.xlsx"`
    );
    res.setHeader('Content-Length', buffer.byteLength);
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};
