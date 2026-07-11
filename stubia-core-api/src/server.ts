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
import packagesRoutes from './routes/packages.routes';
import tasksRoutes from './routes/tasks.routes';
import financeRoutes from './routes/finance.routes';
import documentsRoutes from './routes/documents.routes';
import eventsRoutes from './routes/events.routes';
import chatRoutes from './routes/chat.routes';
import usersRoutes from './routes/users.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationsRoutes from './routes/notifications.routes';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific domains
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// General middlewares
app.use(cors({
  origin: true, // Echo origin to allow credentials
  credentials: true,
}));
// General middlewares with high payload limit for base64 chat media/attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Rate Limiting
const isDev = process.env.NODE_ENV === 'development';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100, // Limit each IP to 100 requests per windowMs (or 10000 in dev)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'API_RATE_LIMIT',
  },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 1000 : 10, // Limit each IP to 10 auth requests per minute (or 1000 in dev)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many auth requests, please slow down.',
    code: 'AUTH_RATE_LIMIT',
  },
});

// Apply rate limits (Disabled to prevent "Too many requests" limits during active usage)
// app.use('/api/', apiLimiter);
// app.use('/api/auth/', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/packages', packagesRoutes);
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
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('Unhandled Error:', err);
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
server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});

export { io, kanbanNamespace, notificationsNamespace, chatNamespace };
