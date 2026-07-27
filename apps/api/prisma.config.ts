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

/**
 * Which env var Migrate connects through.
 *
 * Migrate takes a session-level postgres advisory lock (`pg_advisory_lock`) and holds it
 * across later statements. A transaction-mode pooler — Neon's `-pooler` endpoint, PgBouncer,
 * Supabase's port 6543 — hands each statement a different backend connection, so that lock
 * is never observably held and acquisition times out: `Error: P1002 … Timed out trying to
 * acquire a postgres advisory lock`. The timeout is a hard-coded 10s, not configurable.
 *
 * So point Migrate at a **direct, unpooled** connection via `DIRECT_DATABASE_URL` (for Neon,
 * the same URL with `-pooler` dropped from the host). The runtime client is unaffected and
 * still uses `DATABASE_URL` through the driver adapter in `src/config/prisma.ts` — pooling is
 * the right choice there, just not for migrations.
 *
 * Falls back to `DATABASE_URL` when unset, so local dev against a plain postgres — which has
 * no pooler in front of it — needs no extra configuration.
 *
 * Prisma 6's `datasource.directUrl` did this declaratively; it was removed in v7 in favour of
 * `url`, hence the explicit pick here.
 */
const migrateUrlVar = process.env.DIRECT_DATABASE_URL ? 'DIRECT_DATABASE_URL' : 'DATABASE_URL';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env(migrateUrlVar),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
