import type { Prisma } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { notifyUser } from '../../shared/utils/notify';
import type { RoleName } from '../../shared/constants/roles';
import { badgesRepository } from './badges.repository';
import type {
  AchievementWithRelations,
  BadgeWithRelations,
  MemberBadgeWithRelations,
} from './badges.repository';
import type { CreateAchievementInput, CreateBadgeInput, RecordMemberBadgeInput, UpdateBadgeInput } from './badges.schema';
import type {
  AchievementRecordDto,
  BadgeDto,
  ListAchievementsResponseBody,
  ListBadgesResponseBody,
  ListMemberOptionsResponseBody,
  ListMemberProgressResponseBody,
  MemberBadgeRecordDto,
  MemberOptionDto,
  MemberProgressDto,
} from './badges.types';

type RequestingUser = { id: string; role: RoleName };

function toBadgeDto(badge: BadgeWithRelations): BadgeDto {
  return {
    id: badge.id,
    name: badge.name,
    description: badge.description,
    categoryId: badge.categoryId,
    categoryName: badge.category?.name ?? null,
    requiredPoints: badge.requiredPoints,
    requirements: badge.requirements.map((requirement) => requirement.requirementName),
    earnedCount: badge._count.memberBadges,
  };
}

function toMemberBadgeRecordDto(record: MemberBadgeWithRelations): MemberBadgeRecordDto {
  return {
    id: record.id,
    memberId: record.memberId,
    memberName: `${record.member.firstName} ${record.member.lastName}`,
    troopName: record.member.troop?.name ?? null,
    badgeId: record.badgeId,
    badgeName: record.badge.name,
    badgeCategoryName: record.badge.category?.name ?? null,
    status: record.status,
    earnedAt: record.earnedAt?.toISOString() ?? null,
    verifiedByName: record.verifiedBy?.fullName ?? null,
  };
}

function toMemberOptionDto(member: { id: string; firstName: string; lastName: string; troop: { name: string } | null }): MemberOptionDto {
  return {
    id: member.id,
    fullName: `${member.firstName} ${member.lastName}`,
    troopName: member.troop?.name ?? null,
  };
}

function toAchievementDto(record: AchievementWithRelations): AchievementRecordDto {
  return {
    id: record.id,
    memberId: record.memberId,
    memberName: `${record.member.firstName} ${record.member.lastName}`,
    troopName: record.member.troop?.name ?? null,
    achievementName: record.achievementName,
    description: record.description,
    achievedAt: record.achievedAt.toISOString(),
    recordedByName: record.recordedBy?.fullName ?? null,
  };
}

/** Troop Leader is scoped to members of their own led troop(s); Admin/Executive Council see every troop. */
async function scopeToOwnTroop(user: RequestingUser): Promise<string[] | undefined> {
  if (user.role !== 'troop_leader') return undefined;
  const troops = await badgesRepository.findTroopIdsLedBy(user.id);
  return troops.map((troop) => troop.id);
}

async function requireMemberInScope(memberId: string, user: RequestingUser) {
  const member = await badgesRepository.findMemberById(memberId);
  if (!member) throw ApiError.badRequest('Selected member does not exist.');

  if (user.role === 'troop_leader' && member.troop?.leaderId !== user.id) {
    throw ApiError.forbidden('You can only record badges and achievements for members in your own troop.');
  }
  return member;
}

export const badgesService = {
  // Badge catalog
  async listBadges(): Promise<ListBadgesResponseBody> {
    const badges = await badgesRepository.listBadges();
    return { badges: badges.map(toBadgeDto) };
  },

  async createBadge(input: CreateBadgeInput): Promise<BadgeDto> {
    const existing = await badgesRepository.findBadgeByName(input.name.trim());
    if (existing) throw ApiError.conflict('A badge with this name already exists.');
    const created = await badgesRepository.createBadge(input);
    return toBadgeDto(created);
  },

  async updateBadge(id: string, input: UpdateBadgeInput): Promise<BadgeDto> {
    const badge = await badgesRepository.findBadgeById(id);
    if (!badge) throw ApiError.notFound('Badge not found.');

    const existing = await badgesRepository.findBadgeByName(input.name.trim());
    if (existing && existing.id !== id) throw ApiError.conflict('A badge with this name already exists.');

    const updated = await badgesRepository.updateBadge(id, input);
    return toBadgeDto(updated);
  },

  async deleteBadge(id: string): Promise<void> {
    const badge = await badgesRepository.findBadgeById(id);
    if (!badge) throw ApiError.notFound('Badge not found.');
    // Deliberately not usage-guarded — `BadgeRequirement`/`MemberBadge` both cascade on
    // delete by schema design, same precedent as 2.1's event-delete-cascades-registrations.
    await badgesRepository.deleteBadge(id);
  },

  async listMemberOptions(user: RequestingUser): Promise<ListMemberOptionsResponseBody> {
    const troopIds = await scopeToOwnTroop(user);
    const members = await badgesRepository.listMemberOptions(troopIds);
    return { members: members.map(toMemberOptionDto) };
  },

  // Member progress
  async listMemberProgress(user: RequestingUser): Promise<ListMemberProgressResponseBody> {
    const troopIds = await scopeToOwnTroop(user);
    const where: Prisma.MemberBadgeWhereInput = troopIds ? { member: { troopId: { in: troopIds } } } : {};

    const [records, totalBadges] = await Promise.all([
      badgesRepository.listMemberBadges(where),
      badgesRepository.countCatalog(),
    ]);

    const byMember = new Map<string, MemberBadgeRecordDto[]>();
    for (const record of records.map(toMemberBadgeRecordDto)) {
      byMember.set(record.memberId, [...(byMember.get(record.memberId) ?? []), record]);
    }

    const members: MemberProgressDto[] = [...byMember.values()].map((badges) => {
      const earnedCount = badges.filter((b) => b.status === 'earned' || b.status === 'verified').length;
      return {
        memberId: badges[0]!.memberId,
        memberName: badges[0]!.memberName,
        troopName: badges[0]!.troopName,
        totalBadges,
        earnedCount,
        progressPercent: totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0,
        badges,
      };
    });

    return { members };
  },

  async recordMemberBadge(input: RecordMemberBadgeInput, user: RequestingUser): Promise<MemberBadgeRecordDto> {
    await requireMemberInScope(input.memberId, user);

    const badge = await badgesRepository.findBadgeById(input.badgeId);
    if (!badge) throw ApiError.badRequest('Selected badge does not exist.');

    const record = await badgesRepository.upsertMemberBadge(input.memberId, input.badgeId, input.status);
    return toMemberBadgeRecordDto(record);
  },

  async verifyMemberBadge(id: string, verifiedById: string): Promise<MemberBadgeRecordDto> {
    const record = await badgesRepository.findMemberBadgeById(id);
    if (!record) throw ApiError.notFound('Member badge record not found.');
    if (record.status !== 'earned') {
      throw ApiError.badRequest('Only badges with status "earned" can be verified.');
    }

    const verified = await badgesRepository.verifyMemberBadge(id, verifiedById);
    if (verified.member.troop?.leaderId) {
      await notifyUser({
        userId: verified.member.troop.leaderId,
        title: 'Badge verified',
        message: `${verified.badge.name} for ${verified.member.firstName} ${verified.member.lastName} was verified.`,
      });
    }
    return toMemberBadgeRecordDto(verified);
  },

  // Achievements
  async listAchievements(user: RequestingUser): Promise<ListAchievementsResponseBody> {
    const troopIds = await scopeToOwnTroop(user);
    const where: Prisma.AchievementRecordWhereInput = troopIds ? { member: { troopId: { in: troopIds } } } : {};
    const records = await badgesRepository.listAchievements(where);
    return { achievements: records.map(toAchievementDto) };
  },

  async createAchievement(input: CreateAchievementInput, user: RequestingUser): Promise<AchievementRecordDto> {
    await requireMemberInScope(input.memberId, user);
    const created = await badgesRepository.createAchievement(input, user.id);
    return toAchievementDto(created);
  },
};
