import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { requireAuth } from '../auth';
import { profileController } from './profile.controller';

/**
 * Every route needs only `requireAuth` — every signed-in role manages their own
 * account here, unlike 3.4's Administrator-only `usersRoutes` (build-plan.md §3.5).
 */
const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.get('/', asyncHandler(profileController.getProfile));
profileRouter.put('/', asyncHandler(profileController.updateProfile));
profileRouter.post('/change-password', asyncHandler(profileController.changePassword));

export const profileRoutes = profileRouter;
