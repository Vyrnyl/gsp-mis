import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { env, IS_PRODUCTION } from './env';

/**
 * Prisma client singleton.
 *
 * Prisma 7 no longer reads the connection URL from `schema.prisma` — the runtime
 * client is handed a driver adapter instead. We use node-postgres over TCP, which
 * suits a long-running Express process; the serverless/WebSocket Neon adapter would
 * only pay off in an edge or per-request runtime.
 *
 * Migrate reads its own URL from `prisma.config.ts`. Both ultimately come from
 * `DATABASE_URL`, which `config/env.ts` has already validated by the time this runs.
 *
 * Cached on `globalThis` in development so `tsx watch` reloads do not open a new
 * connection pool on every file change.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: IS_PRODUCTION ? ['error'] : ['warn', 'error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!IS_PRODUCTION) {
  globalForPrisma.prisma = prisma;
}
