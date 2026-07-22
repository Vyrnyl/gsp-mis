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
