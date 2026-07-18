import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import fs from 'fs';
import path from 'path';
import { SupabaseStorageService } from '../services/SupabaseStorageService';

// Local storage backup directory
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Vision/Mission file storage path
const VISION_FILE = path.join(__dirname, '../../data/vision-mission.json');
if (!fs.existsSync(path.dirname(VISION_FILE))) {
  fs.mkdirSync(path.dirname(VISION_FILE), { recursive: true });
}
if (!fs.existsSync(VISION_FILE)) {
  fs.writeFileSync(
    VISION_FILE,
    JSON.stringify({
      vision: 'Menjadi platform bimbingan belajar UTBK SNBT nomor satu di Indonesia yang mendemokratisasi akses pendidikan berkualitas.',
      mission: '1. Menyediakan konten soal latihan berkualitas tinggi setara ujian nasional.\n2. Mengembangkan teknologi pembelajaran AI yang adaptif.\n3. Memberikan wadah kolaboratif bagi tentor dan siswa seluruh Indonesia.',
      coreValues: 'Integritas, Inovasi Pendidikan, Orientasi Hasil, Kerjasama Tim',
    })
  );
}

export const getDocuments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { folderPath } = req.query;
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const folder = (folderPath as string) || 'SOP';

    // RLS Role access checks
    const role = req.user.role;
    if (folder === 'Legal' && !['super_admin', 'academic_manager', 'hr_ops', 'finance_officer'].includes(role)) {
      throw new AppError('Akses ditolak: Folder Legal membutuhkan tingkat peran Manager/Ops/Admin', 403, 'FORBIDDEN');
    }
    if (folder === 'Kontrak' && !['super_admin', 'hr_ops', 'finance_officer'].includes(role)) {
      throw new AppError('Akses ditolak: Folder Kontrak membutuhkan tingkat peran HR/Finance/Admin', 403, 'FORBIDDEN');
    }

    const documents = await prisma.document.findMany({
      where: { folderPath: folder },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { name, folderPath, filename, fileType, fileData } = req.body;

    if (!name || !folderPath || !filename || !fileType || !fileData) {
      throw new AppError('Parameter upload tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    // Version control check
    const existing = await prisma.document.findFirst({
      where: {
        name,
        folderPath,
      },
      orderBy: { version: 'desc' },
    });

    const version = existing ? existing.version + 1 : 1;
    
    // Upload file to Supabase Storage
    const fileUrl = await SupabaseStorageService.uploadFile(
      folderPath,
      filename,
      fileData,
      fileType
    );

    const doc = await prisma.document.create({
      data: {
        name,
        folderPath,
        fileUrl,
        fileType,
        version,
        uploadedById: req.user.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: existing 
        ? `Dokumen baru versi ${version} berhasil diunggah`
        : 'Dokumen pertama berhasil diunggah',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const logDocumentAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { id } = req.params;
    const { action } = req.body; // view, download

    if (!action) {
      throw new AppError('Action wajib diisi', 400, 'VALIDATION_ERROR');
    }

    const log = await prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: req.user.userId,
        action,
      },
    });

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentAccessLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.documentAccessLog.findMany({
      include: {
        document: { select: { name: true, folderPath: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { accessedAt: 'desc' },
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// Vision & Mission endpoints
export const getVisionMission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = JSON.parse(fs.readFileSync(VISION_FILE, 'utf-8'));
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVisionMission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      throw new AppError('Hanya Super Admin yang diizinkan memperbarui visi misi perusahaan', 403, 'FORBIDDEN');
    }
    const { vision, mission, coreValues } = req.body;

    if (!vision || !mission || !coreValues) {
      throw new AppError('Data visi, misi, dan nilai-nilai wajib diisi lengkap', 400, 'VALIDATION_ERROR');
    }

    const data = { vision, mission, coreValues };
    fs.writeFileSync(VISION_FILE, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      message: 'Visi Misi perusahaan berhasil diperbarui',
      data,
    });
  } catch (error) {
    next(error);
  }
};

// OKRs Endpoints
export const getObjectives = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const objectives = await prisma.objective.findMany({
      include: {
        keyResults: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: objectives,
    });
  } catch (error) {
    next(error);
  }
};

export const createObjective = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !['super_admin', 'academic_manager'].includes(req.user.role)) {
      throw new AppError('Akses ditolak: Hanya manager/admin yang bisa membuat Objective OKR', 403, 'FORBIDDEN');
    }
    const { title, targetDate, keyResults } = req.body;

    if (!title || !targetDate || !keyResults || keyResults.length === 0) {
      throw new AppError('Data Objective dan Key Results tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const newObjective = await prisma.objective.create({
      data: {
        title,
        targetDate: new Date(targetDate),
        status: 'ON_TRACK',
        progress: 0.0,
        keyResults: {
          create: keyResults.map((kr: any) => ({
            title: kr.title,
            currentVal: 0.0,
            targetVal: parseFloat(kr.targetVal),
            unit: kr.unit || '%',
          })),
        },
      },
      include: { keyResults: true },
    });

    res.status(201).json({
      success: true,
      message: 'Objective & Key Results berhasil ditambahkan',
      data: newObjective,
    });
  } catch (error) {
    next(error);
  }
};

export const updateKeyResultProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { krId } = req.params;
    const { currentVal } = req.body;

    if (currentVal === undefined) {
      throw new AppError('Nilai kemajuan saat ini wajib dikirimkan', 400, 'VALIDATION_ERROR');
    }

    const keyResult = await prisma.keyResult.findUnique({ where: { id: krId } });
    if (!keyResult) {
      throw new AppError('Key Result tidak ditemukan', 404, 'NOT_FOUND');
    }

    const updatedKR = await prisma.keyResult.update({
      where: { id: krId },
      data: { currentVal: parseFloat(currentVal) },
    });

    // Recalculate Objective overall progress
    const allKRs = await prisma.keyResult.findMany({
      where: { objectiveId: keyResult.objectiveId },
    });

    let totalProgress = 0;
    allKRs.forEach((kr) => {
      const pct = Math.min((kr.currentVal / kr.targetVal) * 100, 100);
      totalProgress += pct;
    });

    const objectiveProgress = Math.round(totalProgress / allKRs.length);

    let status = 'ON_TRACK';
    if (objectiveProgress < 30) status = 'OFF_TRACK';
    else if (objectiveProgress < 60) status = 'AT_RISK';

    await prisma.objective.update({
      where: { id: keyResult.objectiveId },
      data: {
        progress: objectiveProgress,
        status,
      },
    });

    res.json({
      success: true,
      message: 'Progress OKR berhasil diperbarui',
      data: updatedKR,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { id } = req.params;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new AppError('Dokumen tidak ditemukan', 404, 'NOT_FOUND');
    }

    // Access check: only uploader or super_admin can delete
    const isOwner = doc.uploadedById === req.user.userId;
    const isSuperAdmin = req.user.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      throw new AppError('Anda tidak memiliki wewenang untuk menghapus dokumen ini', 403, 'FORBIDDEN');
    }

    // 1. Delete file from storage
    if (doc.fileUrl.startsWith('/uploads/')) {
      // Local storage cleanup (backward compatibility)
      const filePath = path.join(__dirname, '../../public', doc.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Failed to delete file from disk:', err);
        }
      }
    } else {
      // Supabase Storage cleanup
      try {
        await SupabaseStorageService.deleteFile(doc.fileUrl);
      } catch (err) {
        console.error('Failed to delete file from Supabase Storage:', err);
      }
    }

    // 2. Delete document access logs
    await prisma.documentAccessLog.deleteMany({ where: { documentId: id } });

    // 3. Delete document from database
    await prisma.document.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Dokumen berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};
