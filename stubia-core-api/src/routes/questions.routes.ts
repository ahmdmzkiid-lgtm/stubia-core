import { Router } from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  approveQuestion,
  checkSimilarityEndpoint,
  exportQuestions
} from '../controllers/questions.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Secure all routes
router.use(authenticate);

// Export endpoint must be mapped before id-based parameter routes
router.get('/export', requireRole(['super_admin', 'academic_manager', 'content_creator']), exportQuestions);
router.post('/check-similarity', requireRole(['super_admin', 'academic_manager', 'content_creator']), checkSimilarityEndpoint);

// CRUD
router.get('/', requireRole(['super_admin', 'academic_manager', 'content_creator']), getQuestions);
router.post('/', requireRole(['super_admin', 'academic_manager', 'content_creator']), createQuestion);
router.get('/:id', requireRole(['super_admin', 'academic_manager', 'content_creator']), getQuestionById);
router.patch('/:id', requireRole(['super_admin', 'academic_manager', 'content_creator']), updateQuestion);
router.delete('/:id', requireRole(['super_admin', 'academic_manager']), deleteQuestion);
router.patch('/:id/approve', requireRole(['super_admin', 'academic_manager']), approveQuestion);

export default router;
