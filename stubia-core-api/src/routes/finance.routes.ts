import { Router } from 'express';
import {
  getCashflowEntries,
  createCashflowEntry,
  generatePayroll,
  getPayrolls,
  payPayroll,
  getFinanceAnalytics
} from '../controllers/finance.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Secure all routes
router.use(authenticate);

// Finance and Payroll routes
router.get('/cashflow', requireRole(['super_admin', 'finance_officer']), getCashflowEntries);
router.post('/cashflow', requireRole(['super_admin', 'finance_officer']), createCashflowEntry);

router.get('/payroll', requireRole(['super_admin', 'finance_officer']), getPayrolls);
router.post('/payroll/generate', requireRole(['super_admin', 'finance_officer']), generatePayroll);
router.patch('/payroll/:id/pay', requireRole(['super_admin', 'finance_officer']), payPayroll);

router.get('/analytics', requireRole(['super_admin', 'finance_officer']), getFinanceAnalytics);

export default router;
