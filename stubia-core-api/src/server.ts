import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { AppError } from './errors/AppError';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import questionsRoutes from './routes/questions.routes';
import tasksRoutes from './routes/tasks.routes';
import financeRoutes from './routes/finance.routes';
import documentsRoutes from './routes/documents.routes';
import eventsRoutes from './routes/events.routes';
import chatRoutes from './routes/chat.routes';
import usersRoutes from './routes/users.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationsRoutes from './routes/notifications.routes';
import helmet from 'helmet';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Trust proxy for Railway / Cloudflare / reverse proxies
app.set('trust proxy', 1);

// Allowed Origins Configuration
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    return Array.from(new Set([...envOrigins, ...devOrigins]));
  }

  return envOrigins.length > 0 ? envOrigins : devOrigins;
};

const allowedOrigins = getAllowedOrigins();

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true; // Server-to-server or tools
  const cleanOrigin = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.includes(cleanOrigin)) return true;
  try {
    const parsed = new URL(cleanOrigin);
    const host = parsed.hostname;
    if (
      host === 'stubia.id' ||
      host.endsWith('.stubia.id') ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.railway.app') ||
      host.endsWith('.onrender.com') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return true; // Support Vercel, Render, Railway, and custom stubia.id domains
    }
  } catch {
    if (cleanOrigin.includes('stubia.id') || cleanOrigin.includes('vercel.app')) return true;
  }
  return false;
};

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// General middlewares - CORS mounted first to ensure preflight & cross-origin requests always succeed
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  })
);

// Preflight handler
app.options('*', cors());

// HTTP Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded files to be displayed by frontend
  })
);

// General middlewares with high payload limit for base64 chat media/attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Rate Limiting
const isDev = process.env.NODE_ENV === 'development';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 600, // 600 requests per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Terlalu banyak permintaan ke server, silakan coba beberapa saat lagi.',
    code: 'API_RATE_LIMIT',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 20, // Limit to 20 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Terlalu banyak percobaan login, silakan tunggu 15 menit.',
    code: 'AUTH_RATE_LIMIT',
  },
});

// Apply rate limits
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// Standard 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError('Endpoint not found', 404, 'NOT_FOUND'));
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  
  const isProd = process.env.NODE_ENV === 'production';
  let message = err.message || 'Internal server error';

  // In production, do not leak raw stack traces or database schema errors for 500s
  if (isProd && statusCode === 500 && !(err instanceof AppError)) {
    message = 'Terjadi kesalahan pada server. Silakan hubungi administrator.';
  }

  if (statusCode === 500) {
    console.error(`[Unhandled Error] [${req.method}] ${req.originalUrl || req.url}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code: errorCode,
  });
});

// Socket namespaces/events
const kanbanNamespace = io.of('/kanban');
kanbanNamespace.on('connection', (socket) => {
  console.log('User connected to kanban board:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected from kanban board:', socket.id);
  });
});

const notificationsNamespace = io.of('/notifications');
notificationsNamespace.on('connection', (socket) => {
  console.log('User connected to notifications:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected from notifications:', socket.id);
  });
});

const chatNamespace = io.of('/chat');
chatNamespace.on('connection', (socket) => {
  console.log('User connected to chat:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined chat room ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left chat room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from chat:', socket.id);
  });
});

app.set('chatNamespace', chatNamespace);

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
});

export { io, kanbanNamespace, notificationsNamespace, chatNamespace };
