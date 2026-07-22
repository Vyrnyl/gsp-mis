/**
 * Test environment. Loaded before any test file, so `src/config/env.ts` sees a valid
 * configuration when it validates at import time. These are throwaway values — the
 * suite never opens a real database connection.
 */
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] ??=
  'postgresql://postgres:postgres@localhost:5432/gsp_mis_test?schema=public';
process.env['JWT_SECRET'] ??= 'test-jwt-secret-value-that-is-long-enough-32';
process.env['JWT_REFRESH_SECRET'] ??= 'test-refresh-secret-value-that-is-long-enough';
process.env['COOKIE_SECRET'] ??= 'test-cookie-secret-value-that-is-long-enough-1';
