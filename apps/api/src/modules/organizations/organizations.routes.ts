import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { organizationsController } from './organizations.controller';

const router = Router();

/**
 * All three roles hold `organizations:read` (browsing the org hierarchy is useful
 * everywhere — 1.3's registration form depends on it). Create/update/delete is
 * Admin-only per project-overview.md's role matrix and build-plan.md §1.6.
 */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');
const canManage = requireRole('admin');

router.use(requireAuth);

router.get('/councils', anyRole, asyncHandler(organizationsController.listCouncils));
router.post('/councils', canManage, asyncHandler(organizationsController.createCouncil));
router.put('/councils/:id', canManage, asyncHandler(organizationsController.updateCouncil));
router.delete('/councils/:id', canManage, asyncHandler(organizationsController.deleteCouncil));

router.get('/troops', anyRole, asyncHandler(organizationsController.listTroops));
router.post('/troops', canManage, asyncHandler(organizationsController.createTroop));
router.put('/troops/:id', canManage, asyncHandler(organizationsController.updateTroop));
router.delete('/troops/:id', canManage, asyncHandler(organizationsController.deleteTroop));

router.get('/troop-leaders', anyRole, asyncHandler(organizationsController.listTroopLeaders));

router.get('/scout-levels', anyRole, asyncHandler(organizationsController.listScoutLevels));
router.post('/scout-levels', canManage, asyncHandler(organizationsController.createScoutLevel));
router.put('/scout-levels/:id', canManage, asyncHandler(organizationsController.updateScoutLevel));
router.delete('/scout-levels/:id', canManage, asyncHandler(organizationsController.deleteScoutLevel));

router.get('/badge-categories', anyRole, asyncHandler(organizationsController.listBadgeCategories));
router.post('/badge-categories', canManage, asyncHandler(organizationsController.createBadgeCategory));
router.put('/badge-categories/:id', canManage, asyncHandler(organizationsController.updateBadgeCategory));
router.delete('/badge-categories/:id', canManage, asyncHandler(organizationsController.deleteBadgeCategory));

router.get('/activity-categories', anyRole, asyncHandler(organizationsController.listActivityCategories));
router.post('/activity-categories', canManage, asyncHandler(organizationsController.createActivityCategory));
router.put('/activity-categories/:id', canManage, asyncHandler(organizationsController.updateActivityCategory));
router.delete('/activity-categories/:id', canManage, asyncHandler(organizationsController.deleteActivityCategory));

router.get('/schools', anyRole, asyncHandler(organizationsController.listSchools));
router.post('/schools', canManage, asyncHandler(organizationsController.createSchool));
router.put('/schools/:id', canManage, asyncHandler(organizationsController.updateSchool));
router.delete('/schools/:id', canManage, asyncHandler(organizationsController.deleteSchool));

export const organizationsRoutes = router;
