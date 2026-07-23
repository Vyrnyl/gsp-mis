import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { authController } from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

/** The five mutation routes are public by design — auth issues sessions, so none of its own can require one. */
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/signup', asyncHandler(authController.signup));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));

/** First real `requireAuth` gate (feature 1.2) — the shell reads this to render the real signed-in user. */
router.get('/me', requireAuth, asyncHandler(authController.me));

export const authRoutes = router;
