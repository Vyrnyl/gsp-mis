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

router.use(requireAuth);

router.get('/preview', canRead, asyncHandler(reportsController.getPreview));
router.get('/', canRead, asyncHandler(reportsController.listHistory));
router.post('/export', canExport, asyncHandler(reportsController.exportReport));
router.get('/:id/download', canRead, asyncHandler(reportsController.download));

export const reportsRoutes = router;
