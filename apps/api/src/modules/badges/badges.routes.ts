import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { badgesController } from './badges.controller';

/**
 * Role split confirmed before building (progress.md 2.4): catalog CRUD and
 * verification are Administrator-only (project-overview.md's Admin-only "Create
 * badge requirements / Update badge information / Delete badges / Verify
 * achievements"); recording earned badges and achievements is Administrator +
 * Troop Leader ("Badge Tracking" — Record earned badges / Update achievements);
 * Executive Council is read-only everywhere (monitoring only, matches its
 * `badges:read`-only permission grant).
 */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');
const canManageCatalog = requireRole('admin');
const canRecord = requireRole('admin', 'troop_leader');
const canVerify = requireRole('admin');

const catalogRouter = Router();
catalogRouter.use(requireAuth);
catalogRouter.get('/', anyRole, asyncHandler(badgesController.listBadges));
catalogRouter.post('/', canManageCatalog, asyncHandler(badgesController.createBadge));
catalogRouter.put('/:id', canManageCatalog, asyncHandler(badgesController.updateBadge));
catalogRouter.delete('/:id', canManageCatalog, asyncHandler(badgesController.deleteBadge));
catalogRouter.get('/member-options', canRecord, asyncHandler(badgesController.listMemberOptions));

const memberBadgesRouter = Router();
memberBadgesRouter.use(requireAuth);
memberBadgesRouter.get('/', anyRole, asyncHandler(badgesController.listMemberProgress));
memberBadgesRouter.post('/', canRecord, asyncHandler(badgesController.recordMemberBadge));
memberBadgesRouter.patch('/:id/verify', canVerify, asyncHandler(badgesController.verifyMemberBadge));

const achievementsRouter = Router();
achievementsRouter.use(requireAuth);
achievementsRouter.get('/', anyRole, asyncHandler(badgesController.listAchievements));
achievementsRouter.post('/', canRecord, asyncHandler(badgesController.createAchievement));

export const badgeCatalogRoutes = catalogRouter;
export const memberBadgesRoutes = memberBadgesRouter;
export const achievementsRoutes = achievementsRouter;
