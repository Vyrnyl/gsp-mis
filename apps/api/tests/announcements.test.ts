import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/shared/utils/notify', () => ({ notifyUsers: vi.fn() }));

import { announcementsRepository } from '../src/modules/announcements/announcements.repository';
import { announcementsService } from '../src/modules/announcements/announcements.service';
import { notifyUsers } from '../src/shared/utils/notify';
import type { CreateAnnouncementInput, ListAnnouncementsQuery } from '../src/modules/announcements/announcements.schema';

const QUERY: ListAnnouncementsQuery = { page: 1, pageSize: 10 };

const ANNOUNCEMENT_ROW = {
  id: 'ann-1',
  title: 'Provincial Camporee Registration Now Open',
  content: 'Troop leaders may now register their scouts.',
  postedAt: new Date('2026-07-23T09:00:00.000Z'),
  expiresAt: null,
  postedBy: { id: 'user-admin', fullName: 'Marisol Tabuena' },
};

const CREATE_INPUT: CreateAnnouncementInput = {
  title: 'Provincial Camporee Registration Now Open',
  content: 'Troop leaders may now register their scouts.',
};

describe('announcementsService', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('list', () => {
    it('maps rows to DTOs and builds pagination meta', async () => {
      vi.spyOn(announcementsRepository, 'list').mockResolvedValue({ rows: [ANNOUNCEMENT_ROW as never], total: 1 });

      const result = await announcementsService.list(QUERY);

      expect(result.announcements[0]).toMatchObject({
        id: 'ann-1',
        postedBy: { id: 'user-admin', fullName: 'Marisol Tabuena' },
      });
      expect(result.meta).toMatchObject({ page: 1, pageSize: 10, totalItems: 1 });
    });

    it('maps a null postedBy (deleted author) to null', async () => {
      vi.spyOn(announcementsRepository, 'list').mockResolvedValue({
        rows: [{ ...ANNOUNCEMENT_ROW, postedBy: null } as never],
        total: 1,
      });

      const result = await announcementsService.list(QUERY);

      expect(result.announcements[0]!.postedBy).toBeNull();
    });
  });

  describe('create', () => {
    it('creates the post and notifies every other user, excluding the poster', async () => {
      vi.spyOn(announcementsRepository, 'create').mockResolvedValue(ANNOUNCEMENT_ROW as never);
      vi.spyOn(announcementsRepository, 'listAllUserIds').mockResolvedValue([
        { id: 'user-admin' },
        { id: 'user-ec' },
        { id: 'user-liza' },
      ]);

      const result = await announcementsService.create(CREATE_INPUT, 'user-admin');

      expect(result).toMatchObject({ id: 'ann-1' });
      expect(notifyUsers).toHaveBeenCalledWith(
        ['user-ec', 'user-liza'],
        'New announcement posted',
        ANNOUNCEMENT_ROW.title,
      );
    });
  });
});
