import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { EventType, TaskStatus, TaskType } from '@prisma/client';

export const getEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        pic: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, title: true, status: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    // Map lowercase DB enum to uppercase for the frontend
    const formattedEvents = events.map((ev) => ({
      ...ev,
      type: ev.type.toUpperCase(),
    }));

    res.json({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { title, type, startDate, endDate, description } = req.body;

    if (!title || !type || !startDate || !endDate) {
      throw new AppError('Parameter event tidak lengkap', 400, 'VALIDATION_ERROR');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Find Academic Manager or fallback to creator for auto-subtask assignments
    const manager = await prisma.user.findFirst({
      where: { role: 'academic_manager' },
    });
    const defaultAssigneeId = manager ? manager.id : req.user.userId;

    // Map to lowercase to match PostgreSQL/Prisma enum
    const dbType = type.toLowerCase() as EventType;

    const event = await prisma.$transaction(async (tx) => {
      // 1. Create Event
      const newEvent = await tx.event.create({
        data: {
          title,
          type: dbType,
          startDate: start,
          endDate: end,
          description,
          picId: req.user!.userId,
        },
      });

      // 2. If TRYOUT type, auto-generate the three standard subtasks H-14, H-7, H-3
      if (type === 'TRYOUT') {
        const h14Deadline = new Date(start.getTime() - 14 * 24 * 60 * 60 * 1000);
        const h7Deadline = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
        const h3Deadline = new Date(start.getTime() - 3 * 24 * 60 * 60 * 1000);

        await tx.task.createMany({
          data: [
            {
              title: `Validasi Soal Paket — H-14 [${title}]`,
              assigneeId: defaultAssigneeId,
              creatorId: req.user!.userId,
              status: TaskStatus.TODO,
              type: TaskType.review,
              priority: 'P1',
              deadline: h14Deadline,
              eventId: newEvent.id,
              estimatedHours: 4,
            },
            {
              title: `Deploy Paket ke stubia.id — H-7 [${title}]`,
              assigneeId: defaultAssigneeId,
              creatorId: req.user!.userId,
              status: TaskStatus.TODO,
              type: TaskType.soal,
              priority: 'P1',
              deadline: h7Deadline,
              eventId: newEvent.id,
              estimatedHours: 2,
            },
            {
              title: `Push Notifikasi & Marketing — H-3 [${title}]`,
              assigneeId: defaultAssigneeId,
              creatorId: req.user!.userId,
              status: TaskStatus.TODO,
              type: TaskType.marketing,
              priority: 'P2',
              deadline: h3Deadline,
              eventId: newEvent.id,
              estimatedHours: 3,
            },
          ],
        });
      }

      return newEvent;
    });

    res.status(201).json({
      success: true,
      message: type === 'TRYOUT' 
        ? 'Event Tryout berhasil dibuat, 3 subtask otomatis dibuat di Kanban Board'
        : 'Event berhasil dibuat',
      data: {
        ...event,
        type: event.type.toUpperCase(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, type, startDate, endDate, description } = req.body;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Event tidak ditemukan', 404, 'NOT_FOUND');
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: title || existing.title,
        type: type ? (type.toLowerCase() as EventType) : existing.type,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        description: description !== undefined ? description : existing.description,
      },
    });

    res.json({
      success: true,
      message: 'Event berhasil diubah',
      data: {
        ...updated,
        type: updated.type.toUpperCase(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Event tidak ditemukan', 404, 'NOT_FOUND');
    }

    // Delete event (Prisma deletes associated tasks if onDelete Cascade is configured, but let's safely update eventId or clear tasks first)
    await prisma.task.updateMany({
      where: { eventId: id },
      data: { eventId: null },
    });

    await prisma.event.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Event berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};
