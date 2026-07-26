import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { errorHandler, notFoundHandler } from '../src/shared/handlers/error-handler';
import { ApiError } from '../src/shared/utils/api-error';

/**
 * Exercises the same handler wiring as rate-limit.middleware.ts (429 -> ApiError ->
 * the standard error envelope) without going through the real IS_TEST skip, since
 * that skip exists precisely so the rest of the suite isn't rate-limited.
 */
function buildTestApp() {
  const app = express();
  app.use(
    '/probe',
    rateLimit({
      windowMs: 60_000,
      limit: 2,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => next(ApiError.tooManyRequests()),
    }),
  );
  app.get('/probe', (_req, res) => res.json({ success: true, data: null }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('rate limit handler wiring', () => {
  it('allows requests under the limit and rejects once it is exceeded', async () => {
    const app = buildTestApp();

    const first = await request(app).get('/probe');
    const second = await request(app).get('/probe');
    const third = await request(app).get('/probe');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body).toMatchObject({ success: false, error: { code: 'TOO_MANY_REQUESTS' } });
  });
});
