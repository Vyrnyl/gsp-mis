import { Router } from 'express';

import { attendanceRoutes } from '../modules/attendance';
import { authRoutes } from '../modules/auth';
import { dashboardRoutes } from '../modules/dashboard';
import { eventsRoutes } from '../modules/events';
import { healthRoutes } from '../modules/health';
import { membersRoutes } from '../modules/members';
import { organizationsRoutes } from '../modules/organizations';

/**
 * `/api/v1` router (architecture.md §7).
 *
 * Every domain module mounts here as it is built. Protected modules attach their own
 * RBAC middleware inside their `*.routes.ts` — never here, so the guard travels with
 * the route it protects.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/members', membersRoutes);
router.use('/organizations', organizationsRoutes);
router.use('/events', eventsRoutes);
router.use('/attendance', attendanceRoutes);

export const v1Routes = router;
