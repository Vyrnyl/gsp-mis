import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type { CreateAchievementInput, CreateBadgeInput, UpdateBadgeInput } from './badges.schema';

const badgeInclude = {
  category: true,
  requirements: true,
  _count: { select: { memberBadges: { where: { status: { in: ['earned', 'verified'] } } } } },
} satisfies Prisma.BadgeInclude;

const memberBadgeInclude = {
  member: { include: { troop: true } },
  badge: { include: { category: true } },
  verifiedBy: true,
} satisfies Prisma.MemberBadgeInclude;

const achievementInclude = {
  member: { include: { troop: true } },
  recordedBy: true,
} satisfies Prisma.AchievementRecordInclude;

export type BadgeWithRelations = Prisma.BadgeGetPayload<{ include: typeof badgeInclude }>;
export type MemberBadgeWithRelations = Prisma.MemberBadgeGetPayload<{ include: typeof memberBadgeInclude }>;
export type AchievementWithRelations = Prisma.AchievementRecordGetPayload<{ include: typeof achievementInclude }>;

export const badgesRepository = {
  // Badge catalog
  listBadges() {
    return prisma.badge.findMany({ include: badgeInclude, orderBy: { name: 'asc' } });
  },
  findBadgeByName(name: string) {
    return prisma.badge.findUnique({ where: { name } });
  },
  findBadgeById(id: string) {
    return prisma.badge.findUnique({ where: { id }, include: badgeInclude });
  },
  countCatalog() {
    return prisma.badge.count();
  },
  createBadge(input: CreateBadgeInput) {
    return prisma.badge.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        categoryId: input.categoryId ?? null,
        requiredPoints: input.requiredPoints,
        requirements: { create: input.requirements.map((requirementName) => ({ requirementName })) },
      },
      include: badgeInclude,
    });
  },
  updateBadge(id: string, input: UpdateBadgeInput) {
    return prisma.badge.update({
      where: { id },
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        categoryId: input.categoryId ?? null,
        requiredPoints: input.requiredPoints,
        requirements: {
          deleteMany: {},
          create: input.requirements.map((requirementName) => ({ requirementName })),
        },
      },
      include: badgeInclude,
    });
  },
  deleteBadge(id: string) {
    return prisma.badge.delete({ where: { id } });
  },

  // Member lookups (scoping + validation)
  findMemberById(id: string) {
    return prisma.member.findUnique({ where: { id }, include: { troop: true } });
  },
  findTroopIdsLedBy(userId: string) {
    return prisma.troop.findMany({ where: { leaderId: userId }, select: { id: true } });
  },
  // `expiring` is still a current member (renewal due within 30 days, not yet lapsed) —
  // only `pending`/`expired`/`archived`/`rejected` are excluded.
  listMemberOptions(troopIds: string[] | undefined) {
    return prisma.member.findMany({
      where: {
        status: { name: { in: ['active', 'expiring'] } },
        ...(troopIds ? { troopId: { in: troopIds } } : {}),
      },
      include: { troop: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  },

  // Member badges
  listMemberBadges(where: Prisma.MemberBadgeWhereInput) {
    return prisma.memberBadge.findMany({
      where,
      include: memberBadgeInclude,
      orderBy: [{ member: { lastName: 'asc' } }, { member: { firstName: 'asc' } }],
    });
  },
  findMemberBadgeById(id: string) {
    return prisma.memberBadge.findUnique({ where: { id }, include: memberBadgeInclude });
  },
  upsertMemberBadge(memberId: string, badgeId: string, status: 'in_progress' | 'earned') {
    const earnedAt = status === 'earned' ? new Date() : null;
    return prisma.memberBadge.upsert({
      where: { memberId_badgeId: { memberId, badgeId } },
      update: { status, earnedAt, verifiedById: null },
      create: { memberId, badgeId, status, earnedAt },
      include: memberBadgeInclude,
    });
  },
  verifyMemberBadge(id: string, verifiedById: string) {
    return prisma.memberBadge.update({
      where: { id },
      data: { status: 'verified', verifiedById },
      include: memberBadgeInclude,
    });
  },

  // Achievements
  listAchievements(where: Prisma.AchievementRecordWhereInput) {
    return prisma.achievementRecord.findMany({
      where,
      include: achievementInclude,
      orderBy: { achievedAt: 'desc' },
    });
  },
  createAchievement(input: CreateAchievementInput, recordedById: string) {
    return prisma.achievementRecord.create({
      data: {
        memberId: input.memberId,
        achievementName: input.achievementName.trim(),
        description: input.description?.trim() || null,
        achievedAt: new Date(input.achievedAt),
        recordedById,
      },
      include: achievementInclude,
    });
  },
};
