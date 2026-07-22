import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.PORT, () => {
  console.info(`[gsp-api] listening on http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.info(`[gsp-api] ${signal} received — shutting down`);
  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0));
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// Never swallow these — log and exit so the process manager can restart cleanly.
process.on('unhandledRejection', (reason) => {
  console.error('[gsp-api] unhandled rejection', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('[gsp-api] uncaught exception', error);
  process.exit(1);
});
