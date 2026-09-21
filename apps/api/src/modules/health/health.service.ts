import { env } from '../../config/env';
import { healthRepository } from './health.repository';
import type { HealthStatus, LivenessStatus } from './health.types';

const SERVICE_NAME = 'gsp-api';
const SERVICE_VERSION = '0.1.0';

export const healthService = {
  /**
   * Readiness — liveness plus the state of every downstream dependency. Served
   * at /api/v1/health/db, deliberately off the default path so nothing polls it
   * on a schedule.
   *
   * A database that is down makes the service `degraded`, not `ok` — the endpoint
   * must not report health it has not actually checked.
   */
  async getStatus(): Promise<HealthStatus> {
    const isDatabaseUp = await healthRepository.ping();

    return {
      status: isDatabaseUp ? 'ok' : 'degraded',
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      dependencies: {
        database: isDatabaseUp ? 'up' : 'down',
      },
    };
  },

  /**
   * Liveness only — answers "is this process up?" and nothing else.
   *
   * Backs GET /api/v1/health — the default path, because it is the one polled
   * constantly by Render's health check and the keep-alive cron. Checking the
   * database here would wake Neon on every poll and burn the free tier's
   * compute-hour allowance around the clock, which is what this exists to
   * avoid. The database check is getStatus(), served at /health/db.
   */
  getLiveness(): LivenessStatus {
    return {
      status: 'ok',
      service: SERVICE_NAME,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  },
};
