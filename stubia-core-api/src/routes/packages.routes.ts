import { Router } from 'express';
import {
  generatePackageCandidates,
  createPackage,
  getPackages,
  publishPackage,
  exportPackageExcel
} from '../controllers/packages.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Secure all routes
router.use(authenticate);

// Packages routes
router.post('/generate', requireRole(['super_admin', 'academic_manager']), generatePackageCandidates);
router.post('/', requireRole(['super_admin', 'academic_manager']), createPackage);
router.get('/', requireRole(['super_admin', 'academic_manager', 'content_creator']), getPackages);
router.post('/:id/publish', requireRole(['super_admin', 'academic_manager']), publishPackage);
router.get('/:id/export', requireRole(['super_admin', 'academic_manager']), exportPackageExcel);

export default router;
