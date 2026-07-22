import path from 'node:path';

import { config as loadDotenv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * In Prisma 7 the connection URL moved out of `schema.prisma`. Migrate and
 * introspection read it from here; the runtime client gets it separately through the
 * driver adapter in `src/config/prisma.ts`. The seed command also lives here — the
 * `package.json#prisma` key it used to live under was removed in v7.
 *
 * Prisma 7 no longer auto-loads `.env`, so we load it explicitly, resolved from this
 * file's directory rather than the process cwd (matching `src/config/env.ts`).
 */
loadDotenv({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
