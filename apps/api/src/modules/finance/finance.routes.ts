import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { financeController } from './finance.controller';

const router = Router();

/**
 * `finance:read` is Admin + Executive Council (Troop Leader has no Financial
 * Management/Monitoring section in project-overview.md — excluded from the seeded
 * permission entirely). `finance:write` is Admin-only, per the pre-build RBAC fix
 * that removed it from Executive Council (progress.md, feature 3.1) — EC's role is
 * read-only "Financial Monitoring", not "Record payments/expenses".
 */
const canRead = requireRole('admin', 'executive_council');
const canManage = requireRole('admin');
/** The category names only, which fill the Analytics tab's filter. Council Board reads
 * Analytics but holds no `finance:read`, so it gets none of the records behind them. */
const canListExpenseCategories = requireRole('admin', 'executive_council', 'council_board');

router.use(requireAuth);

router.get('/summaries', canRead, asyncHandler(financeController.getSummaries));
router.get('/member-options', canManage, asyncHandler(financeController.listMemberOptions));

router.get('/payments', canRead, asyncHandler(financeController.listPayments));
router.post('/payments', canManage, asyncHandler(financeController.createPayment));

router.get('/expense-categories', canListExpenseCategories, asyncHandler(financeController.listExpenseCategories));
router.get('/expenses', canRead, asyncHandler(financeController.listExpenses));
router.post('/expenses', canManage, asyncHandler(financeController.createExpense));

router.get('/fee-types', canRead, asyncHandler(financeController.listFeeTypes));
router.post('/fee-types', canManage, asyncHandler(financeController.createFeeType));
router.put('/fee-types/:id', canManage, asyncHandler(financeController.updateFeeType));
router.delete('/fee-types/:id', canManage, asyncHandler(financeController.deleteFeeType));

export const financeRoutes = router;
