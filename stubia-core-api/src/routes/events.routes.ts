import { Router } from 'express';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/events.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getEvents);
router.post('/', requireRole(['super_admin', 'academic_manager', 'hr_ops']), createEvent);
router.patch('/:id', requireRole(['super_admin', 'academic_manager', 'hr_ops']), updateEvent);
router.delete('/:id', requireRole(['super_admin', 'academic_manager', 'hr_ops']), deleteEvent);

export default router;
