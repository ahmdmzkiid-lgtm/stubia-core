import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  startTaskTimer,
  stopTaskTimer,
  getHRAnalytics
} from '../controllers/tasks.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Secure all routes
router.use(authenticate);

// Analytics endpoints first
router.get('/analytics/hr', requireRole(['super_admin', 'academic_manager', 'hr_ops']), getHRAnalytics);

// CRUD
router.get('/', getTasks);
router.post('/', requireRole(['super_admin', 'academic_manager']), createTask);
router.patch('/:id/status', updateTaskStatus);

// Time tracking
router.post('/:id/time-log/start', startTaskTimer);
router.post('/:id/time-log/stop', stopTaskTimer);

export default router;
