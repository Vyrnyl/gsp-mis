import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { activityReportsController } from './activity-reports.controller';

const router = Router();

/**
 * All three roles hold `activity-reports:read`. Submitting is gated to Admin +
 * Troop Leader — matching the existing `activity-reports:write` grant in roles.ts,
 * already correctly scoped (checked against project-overview.md pre-build, no
 * correction needed — same outcome as 2.2's attendance RBAC check). Troop Leader is
 * the primary submitter (project-overview.md "Submit activity reports"); Admin's
 * blanket "unrestricted access" covers the rest. Executive Council stays read-only —
 * "Activity Monitoring → View accomplishment reports".
 */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');
const canSubmit = requireRole('admin', 'troop_leader');

router.use(requireAuth);

router.get('/', anyRole, asyncHandler(activityReportsController.list));
router.post('/', canSubmit, asyncHandler(activityReportsController.create));
router.get('/:id', anyRole, asyncHandler(activityReportsController.getById));

export const activityReportsRoutes = router;
