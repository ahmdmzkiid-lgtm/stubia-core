import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Helper: map role to department key
const roleToDept = (role: string): string | null => {
  const map: Record<string, string> = {
    academic_manager: 'academic',
    content_creator: 'content',
    hr_ops: 'hr',
    finance_officer: 'finance',
  };
  return map[role] ?? null;
};

// Helper: ensure default global + department rooms exist
const ensureDefaultRooms = async () => {
  const globalRoom = await prisma.chatRoom.findFirst({ where: { type: 'GLOBAL' } });
  if (!globalRoom) {
    await prisma.chatRoom.create({
      data: { name: 'General Chat (Semua Karyawan)', type: 'GLOBAL' },
    });
  }

  const depts = [
    { name: 'Grup Akademik', department: 'academic' },
    { name: 'Grup Konten & Tentor', department: 'content' },
    { name: 'Grup SDM & Operasional', department: 'hr' },
    { name: 'Grup Keuangan', department: 'finance' },
  ];

  for (const d of depts) {
    const existing = await prisma.chatRoom.findFirst({
      where: { type: 'DEPARTMENT', department: d.department },
    });
    if (!existing) {
      await prisma.chatRoom.create({
        data: { name: d.name, type: 'DEPARTMENT', department: d.department },
      });
    }
  }
};

// Helper: auto-join the user into their default rooms based on role
const autoJoinDefaultRooms = async (userId: string, role: string) => {
  // 1. Global room
  const globalRoom = await prisma.chatRoom.findFirst({ where: { type: 'GLOBAL' } });
  if (globalRoom) {
    const already = await prisma.chatParticipant.findFirst({
      where: { roomId: globalRoom.id, userId },
    });
    if (!already) {
      await prisma.chatParticipant.create({ data: { roomId: globalRoom.id, userId } });
    }
  }

  // 2. Department room(s)
  let depts: string[] = [];
  if (role === 'super_admin') {
    depts = ['academic', 'content', 'hr', 'finance'];
  } else {
    const dept = roleToDept(role);
    if (dept) depts = [dept];
  }

  for (const dept of depts) {
    const deptRoom = await prisma.chatRoom.findFirst({
      where: { type: 'DEPARTMENT', department: dept },
    });
    if (deptRoom) {
      const already = await prisma.chatParticipant.findFirst({
        where: { roomId: deptRoom.id, userId },
      });
      if (!already) {
        await prisma.chatParticipant.create({ data: { roomId: deptRoom.id, userId } });
      }
    }
  }
};

// ─── GET /api/chat/rooms ─────────────────────────────────────────────────────
export const getChatRooms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { userId, role } = req.user;

    await ensureDefaultRooms();
    await autoJoinDefaultRooms(userId, role);

    const userDepts: string[] = [];
    if (role === 'super_admin') {
      userDepts.push('academic', 'content', 'hr', 'finance');
    } else {
      const dept = roleToDept(role);
      if (dept) userDepts.push(dept);
    }

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { type: 'GLOBAL' },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/chat/rooms/:roomId/messages ─────────────────────────────────────
export const getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/chat/rooms/:roomId/messages ────────────────────────────────────
export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content) throw new AppError('Konten pesan wajib diisi', 400, 'VALIDATION_ERROR');

    const message = await prisma.chatMessage.create({
      data: { roomId, senderId: req.user.userId, content },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const chatNamespace = req.app.get('chatNamespace');
    if (chatNamespace) {
      chatNamespace.to(roomId).emit('new_message', message);
    }

    // Trigger Web Push Notifications for background participants
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            select: { userId: true }
          }
        }
      });
      if (room) {
        const { sendPushNotification } = require('../services/PushNotificationService');
        const senderName = message.sender.name;
        room.participants
          .map((p) => p.userId)
          .filter((id) => id !== req.user?.userId)
          .forEach((id) => {
            sendPushNotification(id, `Pesan dari ${senderName}`, content, '/chat', {
              urgency: 'high',
              TTL: 86400,
              tag: `chat-room-${roomId}`,
              vibrate: [200, 100, 200],
              renotify: true
            });
          });
      }
    } catch (err) {
      console.error('Failed to trigger background web push:', err);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/chat/users ──────────────────────────────────────────────────────
export const getActiveUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const users = await prisma.user.findMany({
      where: { id: { not: req.user.userId }, isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/chat/personal ──────────────────────────────────────────────────
export const initiatePersonalChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { targetUserId } = req.body;

    if (!targetUserId) throw new AppError('Target User ID wajib diisi', 400, 'VALIDATION_ERROR');

    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        type: 'PERSONAL',
        AND: [
          { participants: { some: { userId: req.user.userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
      },
    });

    if (existingRoom) return res.json({ success: true, data: existingRoom });

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { name: true } });
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });
    if (!targetUser || !currentUser) throw new AppError('User tidak ditemukan', 404, 'NOT_FOUND');

    const newRoom = await prisma.chatRoom.create({
      data: {
        type: 'PERSONAL',
        name: `${currentUser.name} & ${targetUser.name}`,
        participants: {
          create: [{ userId: req.user.userId }, { userId: targetUserId }],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
      },
    });

    res.status(201).json({ success: true, data: newRoom });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/chat/rooms/:roomId/participants (Super Admin Only) ──────────────
export const addParticipantToRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (req.user.role !== 'super_admin') throw new AppError('Hanya super admin yang dapat menambahkan peserta', 403, 'FORBIDDEN');

    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) throw new AppError('User ID wajib diisi', 400, 'VALIDATION_ERROR');

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room tidak ditemukan', 404, 'NOT_FOUND');
    if (room.type === 'PERSONAL') throw new AppError('Tidak dapat menambahkan peserta ke room personal', 400, 'VALIDATION_ERROR');

    const alreadyIn = await prisma.chatParticipant.findFirst({ where: { roomId, userId } });
    if (alreadyIn) return res.json({ success: true, message: 'Pengguna sudah ada di room ini' });

    const participant = await prisma.chatParticipant.create({
      data: { roomId, userId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    res.status(201).json({ success: true, data: participant });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/chat/rooms/:roomId/participants/:userId (Super Admin Only) ───
export const removeParticipantFromRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (req.user.role !== 'super_admin') throw new AppError('Hanya super admin yang dapat menghapus peserta', 403, 'FORBIDDEN');

    const { roomId, targetUserId } = req.params;

    await prisma.chatParticipant.deleteMany({ where: { roomId, userId: targetUserId } });

    res.json({ success: true, message: 'Peserta berhasil dihapus dari room' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/chat/rooms/:roomId (room detail with participants) ───────────────
export const getRoomDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    if (!room) throw new AppError('Room tidak ditemukan', 404, 'NOT_FOUND');
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/chat/messages/:messageId (Edit Message) ──────────────────────
export const updateMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) throw new AppError('Konten pesan wajib diisi', 400, 'VALIDATION_ERROR');

    const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new AppError('Pesan tidak ditemukan', 404, 'NOT_FOUND');
    if (msg.senderId !== req.user.userId) throw new AppError('Hanya pengirim yang dapat mengedit pesan', 403, 'FORBIDDEN');

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const chatNamespace = req.app.get('chatNamespace');
    if (chatNamespace) {
      chatNamespace.to(msg.roomId).emit('message_updated', updated);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/chat/messages/:messageId (Delete Message for Everyone) ─────────
export const deleteMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const { messageId } = req.params;

    const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new AppError('Pesan tidak ditemukan', 404, 'NOT_FOUND');
    if (msg.senderId !== req.user.userId && req.user.role !== 'super_admin') {
      throw new AppError('Hanya pengirim atau super admin yang dapat menghapus pesan', 403, 'FORBIDDEN');
    }

    await prisma.chatMessage.delete({ where: { id: messageId } });

    const chatNamespace = req.app.get('chatNamespace');
    if (chatNamespace) {
      chatNamespace.to(msg.roomId).emit('message_deleted', { id: messageId, roomId: msg.roomId });
    }

    res.json({ success: true, message: 'Pesan berhasil dihapus untuk semua orang' });
  } catch (error) {
    next(error);
  }
};

