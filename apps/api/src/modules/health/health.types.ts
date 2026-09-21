export type DependencyStatus = 'up' | 'down';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  dependencies: {
    database: DependencyStatus;
  };
}

/**
 * Liveness only — "this process is running". Deliberately carries no
 * `dependencies`, because it touches none: see `healthController.getLiveness`.
 */
export interface LivenessStatus {
  status: 'ok';
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}
