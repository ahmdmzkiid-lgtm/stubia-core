import { Router } from 'express';
import {
  generateQuestions,
  saveGeneratedQuestions,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getLogs
} from '../controllers/ai.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Secure all AI generator routes
router.use(authenticate);

// Generation endpoints
router.post('/generate-questions', requireRole(['content_creator', 'academic_manager', 'super_admin']), generateQuestions);
router.post('/save-generated-questions', requireRole(['content_creator', 'academic_manager', 'super_admin']), saveGeneratedQuestions);

// Skills endpoints
router.get('/skills', requireRole(['content_creator', 'academic_manager', 'super_admin']), getSkills);
router.post('/skills', requireRole(['academic_manager', 'super_admin']), createSkill);
router.patch('/skills/:id', requireRole(['academic_manager', 'super_admin']), updateSkill);
router.delete('/skills/:id', requireRole(['super_admin']), deleteSkill);

// Logs endpoint
router.get('/logs', requireRole(['super_admin']), getLogs);

export default router;
