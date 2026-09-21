import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { healthController } from './health.controller';

const router = Router();

/** GET /api/v1/health — public by design; no RBAC. */
router.get('/', asyncHandler(healthController.getHealth));

/**
 * GET /api/v1/health/live — public liveness probe; no RBAC, no database.
 * Kept distinct from '/' so the keep-alive cron can hold Render awake without
 * waking Neon on every ping.
 */
router.get('/live', healthController.getLiveness);

export const healthRoutes = router;
