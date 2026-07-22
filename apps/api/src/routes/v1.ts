import { Router } from 'express';

import { healthRoutes } from '../modules/health';

/**
 * `/api/v1` router (architecture.md §7).
 *
 * Every domain module mounts here as it is built. Protected modules attach their own
 * RBAC middleware inside their `*.routes.ts` — never here, so the guard travels with
 * the route it protects.
 */
const router = Router();

router.use('/health', healthRoutes);

export const v1Routes = router;
