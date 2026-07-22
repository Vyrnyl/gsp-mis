import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { authController } from './auth.controller';

const router = Router();

/** GET-free by design — auth is all mutations. Public: no requireAuth on either route. */
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));

// signup, logout, forgot-password are wired at Loop step 5 (Wire Write).

export const authRoutes = router;
