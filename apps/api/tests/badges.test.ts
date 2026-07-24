import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/shared/utils/notify', () => ({ notifyUser: vi.fn() }));

import { badgesRepository } from '../src/modules/badges/badges.repository';
import { badgesService } from '../src/modules/badges/badges.service';
import { notifyUser } from '../src/shared/utils/notify';
import type { CreateAchievementInput, CreateBadgeInput, RecordMemberBadgeInput } from '../src/modules/badges/badges.schema';

const ADMIN = { id: 'user-admin', role: 'admin' as const };
const TROOP_LEADER = { id: 'user-liza', role: 'troop_leader' as const };

const BADGE_ROW = {
  id: 'badge-1',
  name: 'Trailblazer',
  description: 'Trailblazer badge',
  categoryId: 'cat-1',
  requiredPoints: 45,
  category: { name: 'Outdoor Skills' },
  requirements: [{ requirementName: 'Complete a 5km hike' }],
  _count: { memberBadges: 2 },
};

const MEMBER_ROW = {
  id: 'mem-1',
  firstName: 'Andrea',
  lastName: 'Villareal',
  troop: { id: 'troop-12', leaderId: 'user-liza', name: 'Troop 12 — Virac' },
};

const MEMBER_BADGE_ROW = {
  id: 'mb-1',
  memberId: 'mem-1',
  badgeId: 'badge-1',
  status: 'earned',
  earnedAt: new Date('2026-07-01T00:00:00.000Z'),
  member: { firstName: 'Andrea', lastName: 'Villareal', troop: { name: 'Troop 12 — Virac' } },
  badge: { name: 'Trailblazer', category: { name: 'Outdoor Skills' } },
  verifiedBy: null,
};

const ACHIEVEMENT_ROW = {
  id: 'ach-1',
  memberId: 'mem-1',
  achievementName: 'Perfect Attendance — Q2 2026',
  description: null,
  achievedAt: new Date('2026-06-30T00:00:00.000Z'),
  member: { firstName: 'Andrea', lastName: 'Villareal', troop: { name: 'Troop 12 — Virac' } },
  recordedBy: { fullName: 'Liza Bagadiong' },
};

const CREATE_BADGE_INPUT: CreateBadgeInput = {
  name: 'Navigator',
  description: '',
  categoryId: 'cat-1',
  requiredPoints: 20,
  requirements: ['Read a topographic map'],
};

const RECORD_INPUT: RecordMemberBadgeInput = { memberId: 'mem-1', badgeId: 'badge-1', status: 'earned' };

const ACHIEVEMENT_INPUT: CreateAchievementInput = {
  memberId: 'mem-1',
  achievementName: 'Perfect Attendance — Q2 2026',
  achievedAt: '2026-06-30',
};

describe('badgesService', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('catalog CRUD', () => {
    it('rejects a duplicate badge name on create', async () => {
      vi.spyOn(badgesRepository, 'findBadgeByName').mockResolvedValue(BADGE_ROW as never);

      await expect(badgesService.createBadge(CREATE_BADGE_INPUT)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('creates a badge with its requirements', async () => {
      vi.spyOn(badgesRepository, 'findBadgeByName').mockResolvedValue(null);
      const createSpy = vi.spyOn(badgesRepository, 'createBadge').mockResolvedValue(BADGE_ROW as never);

      const result = await badgesService.createBadge(CREATE_BADGE_INPUT);

      expect(createSpy).toHaveBeenCalledWith(CREATE_BADGE_INPUT);
      expect(result).toMatchObject({ id: 'badge-1', name: 'Trailblazer', earnedCount: 2 });
    });

    it('rejects updating an unknown badge with 404', async () => {
      vi.spyOn(badgesRepository, 'findBadgeById').mockResolvedValue(null);

      await expect(badgesService.updateBadge('missing', CREATE_BADGE_INPUT)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('rejects deleting an unknown badge with 404', async () => {
      vi.spyOn(badgesRepository, 'findBadgeById').mockResolvedValue(null);

      await expect(badgesService.deleteBadge('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes an existing badge — no usage guard, cascades by schema design', async () => {
      vi.spyOn(badgesRepository, 'findBadgeById').mockResolvedValue(BADGE_ROW as never);
      const deleteSpy = vi.spyOn(badgesRepository, 'deleteBadge').mockResolvedValue(BADGE_ROW as never);

      await badgesService.deleteBadge('badge-1');

      expect(deleteSpy).toHaveBeenCalledWith('badge-1');
    });
  });

  describe('listMemberProgress', () => {
    it('scopes troop leaders to members of their own led troop', async () => {
      vi.spyOn(badgesRepository, 'findTroopIdsLedBy').mockResolvedValue([{ id: 'troop-12' }] as never);
      const listSpy = vi
        .spyOn(badgesRepository, 'listMemberBadges')
        .mockResolvedValue([MEMBER_BADGE_ROW as never]);
      vi.spyOn(badgesRepository, 'countCatalog').mockResolvedValue(6);

      await badgesService.listMemberProgress(TROOP_LEADER);

      expect(listSpy).toHaveBeenCalledWith({ member: { troopId: { in: ['troop-12'] } } });
    });

    it('does not scope admin/executive council — they see every troop', async () => {
      const listSpy = vi
        .spyOn(badgesRepository, 'listMemberBadges')
        .mockResolvedValue([MEMBER_BADGE_ROW as never]);
      vi.spyOn(badgesRepository, 'countCatalog').mockResolvedValue(6);

      await badgesService.listMemberProgress(ADMIN);

      expect(listSpy).toHaveBeenCalledWith({});
    });

    it('aggregates a member’s badges into one progress row', async () => {
      vi.spyOn(badgesRepository, 'listMemberBadges').mockResolvedValue([MEMBER_BADGE_ROW as never]);
      vi.spyOn(badgesRepository, 'countCatalog').mockResolvedValue(4);

      const { members } = await badgesService.listMemberProgress(ADMIN);

      expect(members).toEqual([
        expect.objectContaining({
          memberId: 'mem-1',
          memberName: 'Andrea Villareal',
          troopName: 'Troop 12 — Virac',
          totalBadges: 4,
          earnedCount: 1,
          progressPercent: 25,
        }),
      ]);
    });
  });

  describe('recordMemberBadge', () => {
    it('rejects an unknown member with 400', async () => {
      vi.spyOn(badgesRepository, 'findMemberById').mockResolvedValue(null);

      await expect(badgesService.recordMemberBadge(RECORD_INPUT, ADMIN)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects a troop leader recording a badge for a member outside their own troop', async () => {
      vi.spyOn(badgesRepository, 'findMemberById').mockResolvedValue({
        ...MEMBER_ROW,
        troop: { ...MEMBER_ROW.troop, leaderId: 'someone-else' },
      } as never);

      await expect(badgesService.recordMemberBadge(RECORD_INPUT, TROOP_LEADER)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('rejects an unknown badge with 400', async () => {
      vi.spyOn(badgesRepository, 'findMemberById').mockResolvedValue(MEMBER_ROW as never);
      vi.spyOn(badgesRepository, 'findBadgeById').mockResolvedValue(null);

      await expect(badgesService.recordMemberBadge(RECORD_INPUT, TROOP_LEADER)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('upserts the member badge once member and badge are both confirmed', async () => {
      vi.spyOn(badgesRepository, 'findMemberById').mockResolvedValue(MEMBER_ROW as never);
      vi.spyOn(badgesRepository, 'findBadgeById').mockResolvedValue(BADGE_ROW as never);
      const upsertSpy = vi
        .spyOn(badgesRepository, 'upsertMemberBadge')
        .mockResolvedValue(MEMBER_BADGE_ROW as never);

      const result = await badgesService.recordMemberBadge(RECORD_INPUT, TROOP_LEADER);

      expect(upsertSpy).toHaveBeenCalledWith('mem-1', 'badge-1', 'earned');
      expect(result).toMatchObject({ id: 'mb-1', status: 'earned' });
    });
  });

  describe('verifyMemberBadge', () => {
    it('rejects an unknown member badge with 404', async () => {
      vi.spyOn(badgesRepository, 'findMemberBadgeById').mockResolvedValue(null);

      await expect(badgesService.verifyMemberBadge('missing', 'user-admin')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('rejects verifying a badge that is not yet earned', async () => {
      vi.spyOn(badgesRepository, 'findMemberBadgeById').mockResolvedValue({
        ...MEMBER_BADGE_ROW,
        status: 'in_progress',
      } as never);

      await expect(badgesService.verifyMemberBadge('mb-1', 'user-admin')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('verifies an earned badge', async () => {
      vi.spyOn(badgesRepository, 'findMemberBadgeById').mockResolvedValue(MEMBER_BADGE_ROW as never);
      const verifySpy = vi.spyOn(badgesRepository, 'verifyMemberBadge').mockResolvedValue({
        ...MEMBER_BADGE_ROW,
        status: 'verified',
        verifiedBy: { fullName: 'Marisol Tabuena' },
      } as never);

      const result = await badgesService.verifyMemberBadge('mb-1', 'user-admin');

      expect(verifySpy).toHaveBeenCalledWith('mb-1', 'user-admin');
      expect(result).toMatchObject({ status: 'verified', verifiedByName: 'Marisol Tabuena' });
      // MEMBER_BADGE_ROW's troop carries no leaderId — nothing to notify.
      expect(notifyUser).not.toHaveBeenCalled();
    });

    it("notifies the member's troop leader when one is assigned", async () => {
      vi.spyOn(badgesRepository, 'findMemberBadgeById').mockResolvedValue(MEMBER_BADGE_ROW as never);
      vi.spyOn(badgesRepository, 'verifyMemberBadge').mockResolvedValue({
        ...MEMBER_BADGE_ROW,
        status: 'verified',
        verifiedBy: { fullName: 'Marisol Tabuena' },
        member: { ...MEMBER_BADGE_ROW.member, troop: { name: 'Troop 12 — Virac', leaderId: 'user-liza' } },
      } as never);

      await badgesService.verifyMemberBadge('mb-1', 'user-admin');

      expect(notifyUser).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-liza', title: 'Badge verified' }),
      );
    });
  });

  describe('createAchievement', () => {
    it('rejects a troop leader recording an achievement for a member outside their own troop', async () => {
      vi.spyOn(badgesRepository, 'findMemberById').mockResolvedValue({
        ...MEMBER_ROW,
        troop: { ...MEMBER_ROW.troop, leaderId: 'someone-else' },
      } as never);

      await expect(badgesService.createAchievement(ACHIEVEMENT_INPUT, TROOP_LEADER)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('creates the achievement once the member is confirmed in scope', async () => {
      vi.spyOn(badgesRepository, 'findMemberById').mockResolvedValue(MEMBER_ROW as never);
      const createSpy = vi
        .spyOn(badgesRepository, 'createAchievement')
        .mockResolvedValue(ACHIEVEMENT_ROW as never);

      const result = await badgesService.createAchievement(ACHIEVEMENT_INPUT, TROOP_LEADER);

      expect(createSpy).toHaveBeenCalledWith(ACHIEVEMENT_INPUT, 'user-liza');
      expect(result).toMatchObject({ id: 'ach-1', memberName: 'Andrea Villareal', recordedByName: 'Liza Bagadiong' });
    });
  });
});
