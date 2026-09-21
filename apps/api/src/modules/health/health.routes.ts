import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { healthController } from './health.controller';

const router = Router();

/**
 * GET /api/v1/health — public liveness probe; no RBAC, and no database.
 *
 * This is the default path because it is the one polled constantly: Render's
 * `healthCheckPath` and the keep-alive cron both hit it. Querying Postgres here
 * would wake Neon on every poll and burn the free tier's compute-hour
 * allowance around the clock. Readiness lives at `/health/db`.
 */
router.get('/', healthController.getLiveness);

/**
 * GET /api/v1/health/db — readiness: does the service actually reach its
 * database? Public by design, no RBAC. 503 when the database is down, so this
 * is the endpoint to check when diagnosing an outage — never the one to poll
 * on a schedule.
 */
router.get('/db', asyncHandler(healthController.getHealth));

export const healthRoutes = router;
