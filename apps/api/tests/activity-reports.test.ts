import { beforeEach, describe, expect, it, vi } from 'vitest';

import { activityReportsRepository } from '../src/modules/activity-reports/activity-reports.repository';
import { activityReportsService } from '../src/modules/activity-reports/activity-reports.service';
import type { CreateActivityReportInput, ListActivityReportsQuery } from '../src/modules/activity-reports/activity-reports.schema';

const QUERY: ListActivityReportsQuery = { page: 1, pageSize: 10 };

const REPORT_ROW = {
  id: 'ar-1',
  summary: 'Great turnout.',
  participationNotes: '15 scouts attended.',
  outcomes: 'Badge requirement satisfied.',
  status: 'submitted',
  submittedAt: new Date('2026-07-06T14:30:00.000Z'),
  event: { id: 'evt-1', title: 'Coastal Clean-Up Drive', eventDate: new Date('2026-07-05T00:00:00.000Z') },
  submittedBy: { id: 'user-liza', fullName: 'Liza Bagadiong', ledTroops: [{ name: 'Troop 12 — Virac' }] },
};

const CREATE_INPUT: CreateActivityReportInput = { eventId: 'evt-1', summary: 'Great turnout.' };

describe('activityReportsService', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('list', () => {
    it('scopes troop leaders to their own submissions', async () => {
      const listSpy = vi
        .spyOn(activityReportsRepository, 'list')
        .mockResolvedValue({ rows: [REPORT_ROW as never], total: 1 });

      await activityReportsService.list(QUERY, { id: 'user-liza', role: 'troop_leader' });

      expect(listSpy).toHaveBeenCalledWith(QUERY, { submittedById: 'user-liza' });
    });

    it('does not scope admin/executive council — they see every troop', async () => {
      const listSpy = vi
        .spyOn(activityReportsRepository, 'list')
        .mockResolvedValue({ rows: [REPORT_ROW as never], total: 1 });

      await activityReportsService.list(QUERY, { id: 'user-rosario', role: 'executive_council' });

      expect(listSpy).toHaveBeenCalledWith(QUERY, {});
    });

    it('maps the submitter’s led troop into troopName', async () => {
      vi.spyOn(activityReportsRepository, 'list').mockResolvedValue({ rows: [REPORT_ROW as never], total: 1 });

      const { activityReports } = await activityReportsService.list(QUERY, {
        id: 'user-admin',
        role: 'admin',
      });

      expect(activityReports[0]).toMatchObject({
        id: 'ar-1',
        troopName: 'Troop 12 — Virac',
        status: 'submitted',
      });
    });
  });

  describe('getById', () => {
    it('rejects an unknown report with 404', async () => {
      vi.spyOn(activityReportsRepository, 'findById').mockResolvedValue(null);

      await expect(activityReportsService.getById('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns the mapped report when found', async () => {
      vi.spyOn(activityReportsRepository, 'findById').mockResolvedValue(REPORT_ROW as never);

      const result = await activityReportsService.getById('ar-1');

      expect(result).toMatchObject({ id: 'ar-1', summary: 'Great turnout.' });
    });
  });

  describe('create', () => {
    it('rejects an unknown event with 400', async () => {
      vi.spyOn(activityReportsRepository, 'findEventById').mockResolvedValue(null);

      await expect(activityReportsService.create(CREATE_INPUT, 'user-liza')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('rejects an event that has not happened yet', async () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 1);
      vi.spyOn(activityReportsRepository, 'findEventById').mockResolvedValue({ eventDate: farFuture } as never);

      await expect(activityReportsService.create(CREATE_INPUT, 'user-liza')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('creates the report once the event is confirmed completed', async () => {
      vi.spyOn(activityReportsRepository, 'findEventById').mockResolvedValue({
        eventDate: new Date('2020-01-01T00:00:00.000Z'),
      } as never);
      const createSpy = vi
        .spyOn(activityReportsRepository, 'create')
        .mockResolvedValue(REPORT_ROW as never);

      const result = await activityReportsService.create(CREATE_INPUT, 'user-liza');

      expect(createSpy).toHaveBeenCalledWith(CREATE_INPUT, 'user-liza');
      expect(result).toMatchObject({ id: 'ar-1' });
    });
  });
});
