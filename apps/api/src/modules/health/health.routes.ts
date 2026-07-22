import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { healthController } from './health.controller';

const router = Router();

/** GET /api/v1/health — public by design; no RBAC. */
router.get('/', asyncHandler(healthController.getHealth));

export const healthRoutes = router;
