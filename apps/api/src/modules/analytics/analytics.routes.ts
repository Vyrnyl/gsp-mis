import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { analyticsController } from './analytics.controller';

const router = Router();

/** `analytics:read` is Admin + Executive Council only (seeded permission — Troop
 * Leader has no Analytics section in project-overview.md, and build-plan.md's Done
 * gate for 3.3 says "role-gated to council/admin" explicitly). Already correct in
 * `shared/constants/roles.ts`, no pre-build RBAC fix needed (unlike 1.6/2.1/2.4/3.1). */
const canRead = requireRole('admin', 'executive_council');

router.get('/overview', requireAuth, canRead, asyncHandler(analyticsController.getOverview));

export const analyticsRoutes = router;
