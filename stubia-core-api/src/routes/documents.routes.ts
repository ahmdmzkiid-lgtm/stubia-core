import { Router } from 'express';
import {
  getDocuments,
  uploadDocument,
  logDocumentAccess,
  getDocumentAccessLogs,
  deleteDocument,
  getVisionMission,
  updateVisionMission,
  getObjectives,
  createObjective,
  updateKeyResultProgress
} from '../controllers/documents.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Document drive
router.get('/', getDocuments);
router.post('/upload', uploadDocument);
router.post('/:id/log', logDocumentAccess);
router.delete('/:id', deleteDocument);
router.get('/logs', requireRole(['super_admin']), getDocumentAccessLogs);

// Vision & Mission
router.get('/vision-mission', getVisionMission);
router.post('/vision-mission', requireRole(['super_admin']), updateVisionMission);

// OKRs
router.get('/objectives', getObjectives);
router.post('/objectives', requireRole(['super_admin', 'academic_manager']), createObjective);
router.patch('/key-results/:krId', updateKeyResultProgress);

export default router;
