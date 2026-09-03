import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AppError } from '../errors/AppError';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

const getJwtSecrets = () => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Server misconfiguration: JWT secrets are missing in production', 500, 'CONFIG_ERROR');
    }
    return {
      jwtSecret: jwtSecret || 'dev-only-jwt-secret-key-32charsminimum',
      jwtRefreshSecret: jwtRefreshSecret || 'dev-only-jwt-refresh-secret-key-32chars',
    };
  }

  return { jwtSecret, jwtRefreshSecret };
};

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

const generateTokens = (user: { id: string; role: string; email: string }) => {
  const { jwtSecret, jwtRefreshSecret } = getJwtSecrets();

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    jwtRefreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email dan password wajib diisi', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new AppError('Email atau password salah', 401, 'UNAUTHORIZED');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Email atau password salah', 401, 'UNAUTHORIZED');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { maxAge, ...clearOptions } = getCookieOptions();
    res.clearCookie('refreshToken', clearOptions);

    res.json({
      success: true,
      message: 'Logout berhasil',
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError('Unauthorized: Refresh token not provided', 401, 'UNAUTHORIZED');
    }

    const { jwtRefreshSecret } = getJwtSecrets();
    let decoded: any;

    try {
      decoded = jwt.verify(refreshToken, jwtRefreshSecret);
    } catch (err) {
      throw new AppError('Unauthorized: Invalid refresh token', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('Unauthorized: User not found or inactive', 401, 'UNAUTHORIZED');
    }

    const tokens = generateTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, getCookieOptions());

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
