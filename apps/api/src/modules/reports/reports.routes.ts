import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { reportsController } from './reports.controller';

const router = Router();

/**
 * `reports:read` is all 3 roles — Troop Leader's per-type access (Financial/Executive
 * excluded) is enforced in `reports.service.ts`'s `assertTypeAccess`, not here, since
 * it varies by report type rather than by route. `reports:export` is Admin + Executive
 * Council only (Troop Leader lacks the seeded permission) — same split as finance's
 * `canRead`/`canManage`.
 */
const canRead = requireRole('admin', 'executive_council', 'troop_leader');
const canExport = requireRole('admin', 'executive_council');
/** Resetting the history deletes every role's rows at once, so it is narrower than
 * export: Administrator only, and re-checked in the service. */
const canReset = requireRole('admin');

router.use(requireAuth);

router.get('/preview', canRead, asyncHandler(reportsController.getPreview));
router.get('/', canRead, asyncHandler(reportsController.listHistory));
router.post('/export', canExport, asyncHandler(reportsController.exportReport));
// Declared before `/:id/download` so "reset" can never be read as a report id.
router.delete('/reset', canReset, asyncHandler(reportsController.resetHistory));
router.get('/:id/download', canRead, asyncHandler(reportsController.download));

export const reportsRoutes = router;
