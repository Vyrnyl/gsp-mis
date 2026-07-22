import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { asyncHandler } from '../src/shared/handlers/async-handler';
import { errorHandler, notFoundHandler } from '../src/shared/handlers/error-handler';
import { ApiError } from '../src/shared/utils/api-error';

vi.mock('../src/config/prisma', () => ({
  prisma: { $queryRaw: vi.fn() },
}));

function buildTestApp() {
  const app = express();

  app.get(
    '/api-error',
    asyncHandler(async () => {
      throw ApiError.forbidden('Troop leaders cannot approve memberships');
    }),
  );

  app.get(
    '/zod-error',
    asyncHandler(async () => {
      z.object({ email: z.string().email() }).parse({ email: 'not-an-email' });
    }),
  );

  app.get(
    '/unexpected',
    asyncHandler(async () => {
      throw new Error('boom');
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('asyncHandler + errorHandler', () => {
  const app = buildTestApp();

  it('formats an operational ApiError with its status and code', async () => {
    const response = await request(app).get('/api-error');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Troop leaders cannot approve memberships',
      },
    });
  });

  it('turns a ZodError into a 422 with field-level details', async () => {
    const response = await request(app).get('/zod-error');

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toHaveProperty('email');
  });

  it('catches a rejected promise rather than hanging the request', async () => {
    const response = await request(app).get('/unexpected');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });
});
