import rateLimit from 'express-rate-limit';

import { IS_TEST } from '../../config/env';
import { ApiError } from '../utils/api-error';

/**
 * IP-keyed, in-memory rate limiting (build-plan.md decision #8a). In-memory is
 * correct for a single Render free-tier instance; if the API ever runs more than
 * one replica this needs a shared store (e.g. `rate-limit-redis`) or each replica
 * enforces its own independent limit.
 */
function createRateLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    // Rate limiting would otherwise block the test suite's rapid-fire requests.
    skip: () => IS_TEST,
    handler: (_req, _res, next) => {
      next(ApiError.tooManyRequests());
    },
  });
}

/**
 * 50 requests/minute per IP on every auth route (build-plan.md decision #8a) —
 * loosened twice (15 -> 50) so the client's own manual QA pass doesn't trip it.
 * At this width it's a safety net against scripted abuse, not real brute-force
 * protection for `ADMIN_SIGNUP_KEY` or a password — tighten before a public launch.
 */
const AUTH_WINDOW_MS = 60 * 1000;
const AUTH_LIMIT = 50;

/** Guards `/auth/signup` — the admin role has no gate but the shared `ADMIN_SIGNUP_KEY`. */
export const signupRateLimiter = createRateLimiter(AUTH_WINDOW_MS, AUTH_LIMIT);

/** Guards `/auth/login` against password brute-forcing. */
export const loginRateLimiter = createRateLimiter(AUTH_WINDOW_MS, AUTH_LIMIT);

/** Guards the password-reset request/confirm routes against enumeration and spam. */
export const passwordResetRateLimiter = createRateLimiter(AUTH_WINDOW_MS, AUTH_LIMIT);
