import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { announcementsController } from './announcements.controller';

const router = Router();

/**
 * Reads open to all three roles — project-overview.md frames Troop Leader as
 * receive-only for this module ("Receive announcements", "View council notices"),
 * so posting is gated to Admin + Executive Council, matching the existing
 * `announcements:write` grant (no RBAC correction needed, same outcome as 2.2's
 * pre-build check).
 */
const canPost = requireRole('admin', 'executive_council');

router.use(requireAuth);

router.get('/', asyncHandler(announcementsController.list));
router.post('/', canPost, asyncHandler(announcementsController.create));

export const announcementsRoutes = router;
