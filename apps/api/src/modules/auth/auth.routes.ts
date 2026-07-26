import { Router } from 'express';

import { asyncHandler } from '../../shared/handlers/async-handler';
import { loginRateLimiter, passwordResetRateLimiter, signupRateLimiter } from '../../shared/middleware/rate-limit.middleware';
import { authController } from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

/** The six mutation routes are public by design — auth issues sessions, so none of its own can require one. */
router.post('/login', loginRateLimiter, asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/signup', signupRateLimiter, asyncHandler(authController.signup));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', passwordResetRateLimiter, asyncHandler(authController.forgotPassword));
router.post('/reset-password', passwordResetRateLimiter, asyncHandler(authController.resetPassword));

/** First real `requireAuth` gate (feature 1.2) — the shell reads this to render the real signed-in user. */
router.get('/me', requireAuth, asyncHandler(authController.me));

export const authRoutes = router;
