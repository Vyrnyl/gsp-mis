import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { dashboardController } from './dashboard.controller';

const router = Router();

/** Every authenticated role has a dashboard variant — no `permission` gate on the
 *  nav item either (`shared/components/layout/nav-items.ts`), just a session. */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');

router.get('/', requireAuth, anyRole, asyncHandler(dashboardController.get));

export const dashboardRoutes = router;
