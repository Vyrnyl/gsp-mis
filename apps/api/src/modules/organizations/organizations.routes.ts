import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth, requireRole } from '../auth';
import { organizationsController } from './organizations.controller';

const router = Router();

/** All three roles hold `organizations:read`. */
const anyRole = requireRole('admin', 'executive_council', 'troop_leader');

router.use(requireAuth, anyRole);

router.get('/troops', asyncHandler(organizationsController.listTroops));
router.get('/scout-levels', asyncHandler(organizationsController.listScoutLevels));

export const organizationsRoutes = router;
