import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Difficulty, QuestionType, QuestionSource, QuestionStatus } from '@prisma/client';
import { QuestionExportService } from '../services/QuestionExportService';

const exportService = new QuestionExportService();

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

// Raw SQL query for trigram similarity check
const checkQuestionSimilarity = async (soalText: string, excludeId?: string) => {
  const plainText = stripHtml(soalText);
  if (plainText.length < 30) {
    return [];
  }

  const query = excludeId
    ? prisma.$queryRaw<Array<{ id: string; soal_text: string; sim: number }>>`
        SELECT id, soal_text, similarity(soal_text, ${plainText}) AS sim
        FROM questions
        WHERE similarity(soal_text, ${plainText}) > 0.4 AND id != ${excludeId}
        ORDER BY sim DESC LIMIT 5
      `
    : prisma.$queryRaw<Array<{ id: string; soal_text: string; sim: number }>>`
        SELECT id, soal_text, similarity(soal_text, ${plainText}) AS sim
        FROM questions
        WHERE similarity(soal_text, ${plainText}) > 0.4
        ORDER BY sim DESC LIMIT 5
      `;

  const candidates = await query;
  return candidates.map(c => ({
    id: c.id,
    soalText: c.soal_text,
    similarity: c.sim,
  }));
};

export const checkSimilarityEndpoint = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { soalText, excludeId } = req.body;
    if (!soalText) {
      throw new AppError('soalText wajib dikirimkan', 400, 'VALIDATION_ERROR');
    }

    const candidates = await checkQuestionSimilarity(soalText, excludeId);
    const topScore = candidates.length > 0 ? candidates[0].similarity : 0;

    let status: 'SAFE' | 'WARNING' | 'BLOCKED' = 'SAFE';
    if (topScore > 0.70) {
      status = 'BLOCKED';
    } else if (topScore >= 0.40) {
      status = 'WARNING';
    }

    res.json({
      success: true,
      data: {
        similarityStatus: status,
        similarityScore: topScore,
        candidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { subtes, topic, difficulty, status, source, search, limit = '20', page = '1' } = req.query;

    const parsedLimit = parseInt(limit as string) || 20;
    const parsedPage = parseInt(page as string) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    // Build filters
    const where: any = {};
    if (subtes) where.subtes = subtes as string;
    if (topic) where.topic = topic as string;
    if (difficulty) where.difficulty = difficulty as Difficulty;
    if (status) where.status = status as QuestionStatus;
    if (source) where.source = source as QuestionSource;
    
    if (search) {
      where.soalText = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        take: parsedLimit,
        skip,
        include: {
          createdBy: { select: { name: true, email: true } },
          approvedBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        questions,
        meta: {
          total,
          limit: parsedLimit,
          page: parsedPage,
          totalPages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
      },
    });

    if (!question) {
      throw new AppError('Soal tidak ditemukan', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const { stimulus, soalText, optionsJson, answerKey, explanation, subtes, topic, difficulty, type } = req.body;

    if (!soalText || !optionsJson || !answerKey || !explanation || !subtes || !topic || !difficulty || !type) {
      throw new AppError('Data soal tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    // Anti-bypass check similarity on backend
    const similarityCandidates = await checkQuestionSimilarity(soalText);
    const topScore = similarityCandidates.length > 0 ? similarityCandidates[0].similarity : 0;

    if (topScore > 0.70 && req.user.role === 'content_creator') {
      throw new AppError(
        'Penyimpanan diblokir: Soal terdeteksi sangat mirip (> 70%) dengan soal lain di database.',
        400,
        'DUPLICATE_DETECTED'
      );
    }

    const question = await prisma.question.create({
      data: {
        stimulus: stimulus || '',
        soalText,
        soalHtml: `<p>${soalText}</p>`,
        optionsJson,
        answerKey,
        explanation,
        subtes,
        topic,
        difficulty: difficulty as Difficulty,
        type: type as QuestionType,
        status: QuestionStatus.DRAFT,
        source: QuestionSource.MANUAL,
        createdById: req.user.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Soal berhasil disimpan sebagai Draft',
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stimulus, soalText, optionsJson, answerKey, explanation, subtes, topic, difficulty, type, status } = req.body;

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Soal tidak ditemukan', 404, 'NOT_FOUND');
    }

    // If soal text is updated, check similarity
    if (soalText && soalText !== existing.soalText) {
      const similarityCandidates = await checkQuestionSimilarity(soalText, id);
      const topScore = similarityCandidates.length > 0 ? similarityCandidates[0].similarity : 0;
      if (topScore > 0.70 && req.user?.role === 'content_creator') {
        throw new AppError(
          'Penyimpanan diblokir: Edit soal terdeteksi sangat mirip (> 70%) dengan soal lain di database.',
          400,
          'DUPLICATE_DETECTED'
        );
      }
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        stimulus: stimulus !== undefined ? stimulus : existing.stimulus,
        soalText: soalText ?? existing.soalText,
        soalHtml: soalText ? `<p>${soalText}</p>` : existing.soalHtml,
        optionsJson: optionsJson ?? existing.optionsJson,
        answerKey: answerKey ?? existing.answerKey,
        explanation: explanation ?? existing.explanation,
        subtes: subtes ?? existing.subtes,
        topic: topic ?? existing.topic,
        difficulty: difficulty ? (difficulty as Difficulty) : existing.difficulty,
        type: type ? (type as QuestionType) : existing.type,
        status: status ? (status as QuestionStatus) : existing.status,
      },
    });

    res.json({
      success: true,
      message: 'Soal berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const approveQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { id } = req.params;

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new AppError('Soal tidak ditemukan', 404, 'NOT_FOUND');
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        status: QuestionStatus.APPROVED,
        approvedById: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Soal berhasil disetujui (Approved)',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.question.update({
      where: { id },
      data: { status: QuestionStatus.ARCHIVED },
    });

    res.json({
      success: true,
      message: 'Soal berhasil diarsipkan (Archived)',
    });
  } catch (error) {
    next(error);
  }
};

export const exportQuestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { subtes, topic, difficulty, status, source, limit = '100' } = req.query;

    const parsedLimit = Math.min(parseInt(limit as string) || 100, 500);

    const where: any = {};
    if (subtes) where.subtes = subtes as string;
    if (topic) where.topic = topic as string;
    if (difficulty) where.difficulty = difficulty as Difficulty;
    if (status) where.status = status as QuestionStatus;
    else where.status = QuestionStatus.APPROVED; // default export only approved
    
    if (source) where.source = source as QuestionSource;

    const questions = await prisma.question.findMany({
      where,
      take: parsedLimit,
      orderBy: { createdAt: 'desc' },
    });

    const subtesName = (subtes as string) || 'Semua';
    const workbook = await exportService.exportQuestionsToExcel(questions, subtesName);

    const timestamp = Date.now();
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="stubia-soal-${timestamp}.xlsx"`
    );
    res.setHeader('Content-Length', buffer.byteLength);
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};
