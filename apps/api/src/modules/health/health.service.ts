import { env } from '../../config/env';
import { healthRepository } from './health.repository';
import type { HealthStatus, LivenessStatus } from './health.types';

const SERVICE_NAME = 'gsp-api';
const SERVICE_VERSION = '0.1.0';

export const healthService = {
  /**
   * Report liveness plus the state of every downstream dependency.
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
   * Separate from getStatus() because the keep-alive cron calls it every few
   * minutes to stop Render spinning down. Checking the database here would wake
   * Neon on every ping and burn the free tier's compute-hour allowance around
   * the clock, which is what this endpoint exists to avoid.
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
