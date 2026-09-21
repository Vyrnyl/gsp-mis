import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';
import { healthRepository } from '../src/modules/health/health.repository';
import { healthService } from '../src/modules/health/health.service';

vi.mock('../src/config/prisma', () => ({
  prisma: { $queryRaw: vi.fn() },
}));

describe('health service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports ok when the database answers', async () => {
    vi.spyOn(healthRepository, 'ping').mockResolvedValue(true);

    const status = await healthService.getStatus();

    expect(status.status).toBe('ok');
    expect(status.dependencies.database).toBe('up');
    expect(status.service).toBe('gsp-api');
  });

  it('reports degraded when the database is unreachable', async () => {
    vi.spyOn(healthRepository, 'ping').mockResolvedValue(false);

    const status = await healthService.getStatus();

    expect(status.status).toBe('degraded');
    expect(status.dependencies.database).toBe('down');
  });
});

describe('GET /api/v1/health/db', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 and the success envelope when healthy', async () => {
    vi.spyOn(healthRepository, 'ping').mockResolvedValue(true);

    const response = await request(app).get('/api/v1/health/db');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', dependencies: { database: 'up' } },
    });
  });

  it('returns 503 when a dependency is down', async () => {
    vi.spyOn(healthRepository, 'ping').mockResolvedValue(false);

    const response = await request(app).get('/api/v1/health/db');

    expect(response.status).toBe(503);
    expect(response.body.data.status).toBe('degraded');
  });
});

describe('GET /api/v1/health', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 without touching the database', async () => {
    const ping = vi.spyOn(healthRepository, 'ping');

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', service: 'gsp-api' },
    });
    // The whole point of this route: Render's health check and the keep-alive
    // cron both poll it constantly, and neither must wake Neon.
    expect(ping).not.toHaveBeenCalled();
  });

  it('stays 200 even when the database is unreachable', async () => {
    vi.spyOn(healthRepository, 'ping').mockResolvedValue(false);

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data).not.toHaveProperty('dependencies');
  });
});

describe('unmatched routes', () => {
  it('returns the error envelope with a 404', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});
