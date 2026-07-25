import path from 'node:path';

import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Resolve `.env` from the workspace root rather than the process cwd, so `npm start`
// from the monorepo root behaves the same as `npm run dev` from apps/api.
// __dirname is src/config in dev and dist/config after a build — both are two levels
// below apps/api.
loadDotenv({ path: path.resolve(__dirname, '../../.env') });

/**
 * Typed environment schema.
 *
 * Secrets come from the environment only — never from source (code-standards.md §10).
 * Validation runs at import time and throws, so a misconfigured process fails fast on
 * boot rather than at the first request that needs a secret.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),

  JWT_EXPIRES_IN: z.string().default('3h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  /** Comma-separated list of origins allowed to call the API (the BFF, in practice). */
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  /** Gate on self-service admin signup — matches the prototype's "Admin Secret Key" field. */
  ADMIN_SIGNUP_KEY: z.string().min(1, 'ADMIN_SIGNUP_KEY is required'),

  /**
   * Shared EmailService (build-plan.md §7, open decision #7). SMTP is optional —
   * when unset, the service logs emails to the console instead of failing boot, so
   * dev/test never needs real mail credentials. Set all three to send for real.
   */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Girl Scouts of the Philippines <no-reply@gsp-mis.local>'),

  /** Base URL of the web app — used to build links inside outgoing emails (e.g. password reset). */
  WEB_APP_URL: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema> & { corsOrigins: string[] };

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration.\n${details}\n\nCopy apps/api/.env.example to apps/api/.env and fill it in.`,
    );
  }

  return {
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

export const env: Env = loadEnv();

export const IS_PRODUCTION = env.NODE_ENV === 'production';
export const IS_TEST = env.NODE_ENV === 'test';
