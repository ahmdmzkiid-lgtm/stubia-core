import { Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcryptjs';

// ─── GET /api/users ───────────────────────────────────────────────────────────
export const listUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const allowedRoles = ['super_admin', 'academic_manager', 'hr_ops'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Akses ditolak', 403, 'FORBIDDEN');
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/users ──────────────────────────────────────────────────────────
export const createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (req.user.role !== 'super_admin') throw new AppError('Akses ditolak', 403, 'FORBIDDEN');

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      throw new AppError('Nama, email, password, dan role wajib diisi', 400, 'VALIDATION_ERROR');
    }

    const validRoles = ['academic_manager', 'content_creator', 'hr_ops', 'finance_officer', 'super_admin'];
    if (!validRoles.includes(role)) {
      throw new AppError('Role tidak valid', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email sudah terdaftar', 409, 'CONFLICT');

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    res.status(201).json({ success: true, message: 'Akun karyawan berhasil dibuat', data: user });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/users/:id ─────────────────────────────────────────────────────
export const updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (req.user.role !== 'super_admin') throw new AppError('Akses ditolak', 403, 'FORBIDDEN');

    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AppError('User tidak ditemukan', 404, 'NOT_FOUND');

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    res.json({ success: true, message: 'Data karyawan berhasil diperbarui', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/users/:id (soft delete = deactivate) ────────────────────────
export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (req.user.role !== 'super_admin') throw new AppError('Akses ditolak', 403, 'FORBIDDEN');

    const { id } = req.params;

    if (id === req.user.userId) {
      throw new AppError('Tidak dapat menonaktifkan akun sendiri', 400, 'VALIDATION_ERROR');
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AppError('User tidak ditemukan', 404, 'NOT_FOUND');

    // Soft delete: mark inactive
    await prisma.user.update({ where: { id }, data: { isActive: false } });

    res.json({ success: true, message: 'Akun karyawan berhasil dinonaktifkan' });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/users/:id/restore ────────────────────────────────────────────
export const restoreUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    if (req.user.role !== 'super_admin') throw new AppError('Akses ditolak', 403, 'FORBIDDEN');

    const { id } = req.params;

    await prisma.user.update({ where: { id }, data: { isActive: true } });

    res.json({ success: true, message: 'Akun karyawan berhasil diaktifkan kembali' });
  } catch (error) {
    next(error);
  }
};
