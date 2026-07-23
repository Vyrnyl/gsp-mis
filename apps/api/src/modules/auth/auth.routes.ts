import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { authController } from './auth.controller';

const router = Router();

/** GET-free by design — auth is all mutations. All five routes are public: no requireAuth. */
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/signup', asyncHandler(authController.signup));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));

export const authRoutes = router;
