import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';
import { analyticsService } from '../src/modules/analytics/analytics.service';
import { financeService } from '../src/modules/finance/finance.service';
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from '../src/shared/constants/roles';
import { signAccessToken } from '../src/shared/utils/jwt';

const API = '/api/v1';
const SOME_ID = '3538280e-77c6-46bd-9d42-1d5c1d7bf322';

function asCouncilBoard() {
  return `Bearer ${signAccessToken({ sub: 'board-1', role: ROLES.COUNCIL_BOARD })}`;
}

describe('Council Board role', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('holds read permissions only', () => {
    expect(ROLE_PERMISSIONS[ROLES.COUNCIL_BOARD].sort()).toEqual(
      [PERMISSIONS.ORGANIZATIONS_READ, PERMISSIONS.EVENTS_READ, PERMISSIONS.ANALYTICS_READ].sort(),
    );
  });

  it.each([
    '/members',
    '/activity-reports',
    '/badges',
    '/announcements',
    '/finance/summaries',
    '/finance/payments',
    '/finance/expenses',
    '/finance/fee-types',
    '/reports',
    '/settings',
    '/users',
    '/audit-logs',
  ])('is refused GET %s', async (path) => {
    const response = await request(app).get(`${API}${path}`).set('Authorization', asCouncilBoard());

    expect(response.status).toBe(403);
  });

  it.each([
    ['post', '/events'],
    ['put', `/events/${SOME_ID}`],
    ['delete', `/events/${SOME_ID}`],
    ['post', `/events/${SOME_ID}/registrations`],
    ['patch', `/events/${SOME_ID}/registrations/${SOME_ID}`],
    ['post', '/attendance'],
    ['post', '/organizations/troops'],
    ['put', `/organizations/troops/${SOME_ID}`],
    ['delete', `/organizations/troops/${SOME_ID}`],
    ['post', '/organizations/municipalities'],
    ['post', '/organizations/schools'],
    ['post', '/announcements'],
    ['post', '/finance/expenses'],
    ['post', '/members'],
  ] as const)('is refused %s %s', async (method, path) => {
    const response = await request(app)[method](`${API}${path}`).set('Authorization', asCouncilBoard()).send({});

    expect(response.status).toBe(403);
  });

  it('reaches Analytics and the expense category names its filter needs', async () => {
    vi.spyOn(analyticsService, 'getOverview').mockResolvedValue({} as never);
    vi.spyOn(financeService, 'listExpenseCategories').mockResolvedValue({ categories: [] });

    const analytics = await request(app).get(`${API}/analytics/overview`).set('Authorization', asCouncilBoard());
    const categories = await request(app).get(`${API}/finance/expense-categories`).set('Authorization', asCouncilBoard());

    expect(analytics.status).toBe(200);
    expect(categories.status).toBe(200);
  });
});
