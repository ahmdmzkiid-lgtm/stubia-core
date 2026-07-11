import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { PackageGeneratorService } from '../services/PackageGeneratorService';
import { QuestionExportService } from '../services/QuestionExportService';

const generatorService = new PackageGeneratorService();
const exportService = new QuestionExportService();

export const generatePackageCandidates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { subtes, totalQuestions, topicsDistribution, difficultyDistribution, includeAi, minSimilarityThreshold } = req.body;

    if (!subtes || !totalQuestions || !topicsDistribution || !difficultyDistribution) {
      throw new AppError('Kriteria penjadwalan generator tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const questions = await generatorService.generatePackage({
      subtes,
      totalQuestions: parseInt(totalQuestions) || 10,
      topicsDistribution,
      difficultyDistribution,
      includeAi: includeAi !== undefined ? !!includeAi : true,
      minSimilarityThreshold: parseFloat(minSimilarityThreshold) || 0.40,
    });

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { name, configJson } = req.body;

    if (!name || !configJson || !configJson.questions || configJson.questions.length === 0) {
      throw new AppError('Parameter paket tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const newPackage = await prisma.questionPackage.create({
      data: {
        name,
        configJson,
        status: 'DRAFT',
        createdById: req.user.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Paket soal berhasil dibuat sebagai Draft',
      data: newPackage,
    });
  } catch (error) {
    next(error);
  }
};

export const getPackages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const packages = await prisma.questionPackage.findMany({
      include: {
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

export const publishPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pkg = await prisma.questionPackage.findUnique({ where: { id } });
    if (!pkg) {
      throw new AppError('Paket soal tidak ditemukan', 404, 'NOT_FOUND');
    }

    // Update package status to ACTIVE
    const updated = await prisma.questionPackage.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // Simulate push to stubia.id API
    console.log(`[LMS Sync] Syncing package ${id} to stubia.id...`);
    // Simulated delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    res.json({
      success: true,
      message: 'Paket berhasil dipublikasikan ke LMS stubia.id!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const exportPackageExcel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pkg = await prisma.questionPackage.findUnique({ where: { id } });
    if (!pkg) {
      throw new AppError('Paket tidak ditemukan', 404, 'NOT_FOUND');
    }

    const config = pkg.configJson as any;
    const questionIds = config?.questions || [];

    if (questionIds.length === 0) {
      throw new AppError('Paket tidak memiliki daftar soal', 400, 'VALIDATION_ERROR');
    }

    // Query questions matching the stored IDs
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
    });

    // Re-order questions to match the original package IDs array order
    const orderedQuestions = questionIds
      .map((qId: string) => questions.find((q) => q.id === qId))
      .filter((q: any) => !!q);

    const workbook = await exportService.exportQuestionsToExcel(orderedQuestions, pkg.name);

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="stubia-paket-${pkg.name.toLowerCase().replace(/\s+/g, '-')}.xlsx"`
    );
    res.setHeader('Content-Length', buffer.byteLength);
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};
