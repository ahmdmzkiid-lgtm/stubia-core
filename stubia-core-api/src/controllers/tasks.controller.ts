import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { TaskStatus, TaskType } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { SupabaseStorageService } from '../services/SupabaseStorageService';

export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, assigneeId } = req.query;

    const where: any = {};
    if (status) where.status = status as TaskStatus;
    
    const isManagement = req.user?.role === 'super_admin' || req.user?.role === 'academic_manager' || req.user?.role === 'hr_ops';
    if (!isManagement) {
      where.assigneeId = req.user?.userId;
    } else if (assigneeId) {
      where.assigneeId = assigneeId as string;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true } },
        timeLogs: {
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { title, description, assigneeId, deadline } = req.body;

    if (!title || !assigneeId || !deadline) {
      throw new AppError('Data tugas tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        assigneeId,
        deadline: new Date(deadline),
        status: TaskStatus.TODO,
        type: TaskType.soal,
        creatorId: req.user.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tugas berhasil dibuat & ditugaskan',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { id } = req.params;
    const { status, proofName, proofType, proofData, feedback } = req.body;

    if (!status) {
      throw new AppError('Status wajib diisi', 400, 'VALIDATION_ERROR');
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new AppError('Tugas tidak ditemukan', 404, 'NOT_FOUND');
    }

    // Role-based Status checks
    const isOwner = task.assigneeId === req.user.userId;
    const isManager = req.user.role === 'super_admin' || req.user.role === 'academic_manager';

    if (req.user.role === 'finance_officer') {
      throw new AppError('Finance Officer hanya memiliki akses baca-saja untuk tugas', 403, 'FORBIDDEN');
    }

    if (!isManager && !isOwner) {
      throw new AppError('Anda tidak memiliki wewenang untuk mengubah tugas ini', 403, 'FORBIDDEN');
    }

    if (!isManager) {
      if (task.status === 'DONE') {
        throw new AppError('Tugas yang sudah disetujui tidak dapat diubah kembali oleh staf', 403, 'FORBIDDEN');
      }
      if (status === 'DONE') {
        throw new AppError('Hanya Academic Manager atau Super Admin yang dapat menyetujui tugas (DONE)', 403, 'FORBIDDEN');
      }
    }

    // Enforce proof requirement when submitting for review
    if (!isManager && status === 'REVIEW') {
      if (!proofData || !proofName) {
        throw new AppError('Anda harus menyertakan bukti screenshot atau file excel saat mengirim tugas untuk direview.', 400, 'VALIDATION_ERROR');
      }
    }

    let proofUrl = undefined;
    let finalProofName = undefined;

    if (proofData && proofName) {
      let fileType = proofType;
      if (!fileType) {
        const match = proofData.match(/^data:([^;]+);base64,/);
        fileType = match ? match[1] : 'application/octet-stream';
      }

      proofUrl = await SupabaseStorageService.uploadFile(
        'tasks',
        proofName,
        proofData,
        fileType
      );
      finalProofName = proofName;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { 
        status: status as TaskStatus,
        ...(proofUrl ? { proofUrl, proofName: finalProofName } : {}),
        ...(feedback ? { description: `${task.description || ''}\n\n[Catatan Revisi - ${new Date().toLocaleDateString('id-ID')}]: ${feedback}` } : {})
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      success: true,
      message: `Status tugas berhasil diperbarui ke ${status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const startTaskTimer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new AppError('Tugas tidak ditemukan', 404, 'NOT_FOUND');
    }

    if (task.assigneeId !== req.user.userId) {
      throw new AppError('Anda hanya boleh merekam waktu pada tugas yang ditugaskan kepada Anda', 403, 'FORBIDDEN');
    }

    // Check if user has other active time logs running
    const activeLog = await prisma.taskTimeLog.findFirst({
      where: {
        userId: req.user.userId,
        stoppedAt: null,
      },
    });

    if (activeLog) {
      throw new AppError('Anda memiliki pelacakan aktif lain yang berjalan. Silakan hentikan dulu.', 400, 'ACTIVE_TIMER_EXISTS');
    }

    const newLog = await prisma.taskTimeLog.create({
      data: {
        taskId: id,
        userId: req.user.userId,
        startedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Timer kerja berhasil dimulai',
      data: newLog,
    });
  } catch (error) {
    next(error);
  }
};

export const stopTaskTimer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { id } = req.params;

    const activeLog = await prisma.taskTimeLog.findFirst({
      where: {
        taskId: id,
        userId: req.user.userId,
        stoppedAt: null,
      },
    });

    if (!activeLog) {
      throw new AppError('Tidak ada timer aktif yang berjalan untuk tugas ini', 404, 'NOT_FOUND');
    }

    const endTime = new Date();
    const durationSeconds = Math.max(
      Math.round((endTime.getTime() - activeLog.startedAt.getTime()) / 1000),
      1
    );

    const updatedLog = await prisma.taskTimeLog.update({
      where: { id: activeLog.id },
      data: {
        stoppedAt: endTime,
        durationSeconds,
      },
    });

    res.json({
      success: true,
      message: `Timer dihentikan. Anda mencatat waktu selama ${Math.round(durationSeconds / 60)} menit.`,
      data: updatedLog,
    });
  } catch (error) {
    next(error);
  }
};

export const getHRAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Get all active users to calculate their actual logged hours
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        taskTimeLogs: {
          where: { NOT: { stoppedAt: null } }
        }
      }
    });

    const hoursPerEmployee = users.map((u) => {
      const totalSeconds = u.taskTimeLogs.reduce((sum, log) => sum + log.durationSeconds, 0);
      return {
        name: u.name,
        hours: Math.round((totalSeconds / 3600) * 10) / 10,
      };
    });

    // 2. Task counts by status
    const tasks = await prisma.task.findMany();
    const statusMap: Record<string, number> = { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    tasks.forEach((t) => {
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });

    const taskVolumeByStatus = Object.keys(statusMap).map((status) => ({
      name: status,
      value: statusMap[status],
    }));

    // 3. Get done tasks to calculate actual completion velocity in days
    const doneTasks = await prisma.task.findMany({
      where: { status: 'DONE' },
      include: {
        timeLogs: {
          where: { NOT: { stoppedAt: null } }
        }
      }
    });

    let totalDoneDays = 0;
    const avgCompletionVelocity = doneTasks.map((t) => {
      let days = 0;
      if (t.timeLogs.length > 0) {
        const totalSeconds = t.timeLogs.reduce((sum, log) => sum + log.durationSeconds, 0);
        days = totalSeconds / 86400;
        if (days === 0) {
          const starts = t.timeLogs.map(l => l.startedAt.getTime());
          const stops = t.timeLogs.map(l => l.stoppedAt ? l.stoppedAt.getTime() : new Date().getTime());
          const firstStart = Math.min(...starts);
          const lastStop = Math.max(...stops);
          days = (lastStop - firstStart) / (1000 * 60 * 60 * 24);
        }
      } else {
        days = (new Date().getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      }
      const roundedDays = Math.max(0.1, Math.round(days * 10) / 10);
      totalDoneDays += roundedDays;
      return {
        name: t.title,
        days: roundedDays,
      };
    });

    const averageCompletionDays = doneTasks.length > 0
      ? Math.round((totalDoneDays / doneTasks.length) * 10) / 10
      : 0;

    res.json({
      success: true,
      data: {
        hoursPerEmployee,
        taskVolumeByStatus,
        avgCompletionVelocity: avgCompletionVelocity.slice(0, 5),
        averageCompletionDays,
      },
    });
  } catch (error) {
    next(error);
  }
};
