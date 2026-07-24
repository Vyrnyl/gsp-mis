import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth } from '../auth';
import { notificationsController } from './notifications.controller';

const router = Router();

/**
 * Always scoped to the requester's own rows (`req.user!.id`), never another user's —
 * every role holds `notifications:read`, so there is no role gate beyond
 * authentication itself.
 */
router.use(requireAuth);

router.get('/', asyncHandler(notificationsController.list));
router.patch('/read-all', asyncHandler(notificationsController.markAllRead));
router.patch('/:id/read', asyncHandler(notificationsController.markRead));

export const notificationsRoutes = router;
