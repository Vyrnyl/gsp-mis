import { Router } from 'express';

import { activityReportsRoutes } from '../modules/activity-reports';
import { announcementsRoutes } from '../modules/announcements';
import { attendanceRoutes } from '../modules/attendance';
import { authRoutes } from '../modules/auth';
import { achievementsRoutes, badgeCatalogRoutes, memberBadgesRoutes } from '../modules/badges';
import { dashboardRoutes } from '../modules/dashboard';
import { eventsRoutes } from '../modules/events';
import { financeRoutes } from '../modules/finance';
import { healthRoutes } from '../modules/health';
import { membersRoutes } from '../modules/members';
import { notificationsRoutes } from '../modules/notifications';
import { organizationsRoutes } from '../modules/organizations';
import { reportsRoutes } from '../modules/reports';

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
router.use('/activity-reports', activityReportsRoutes);
router.use('/badges', badgeCatalogRoutes);
router.use('/member-badges', memberBadgesRoutes);
router.use('/achievements', achievementsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/finance', financeRoutes);
router.use('/reports', reportsRoutes);

export const v1Routes = router;
