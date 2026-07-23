import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type {
  CreateCategoryInput,
  CreateCouncilInput,
  CreateScoutLevelInput,
  CreateTroopInput,
  UpdateCategoryInput,
  UpdateCouncilInput,
  UpdateScoutLevelInput,
  UpdateTroopInput,
} from './organizations.schema';

const councilInclude = { _count: { select: { troops: true, members: true } } } satisfies Prisma.CouncilInclude;
const troopInclude = {
  council: true,
  leader: true,
  _count: { select: { members: true } },
} satisfies Prisma.TroopInclude;
const scoutLevelInclude = { _count: { select: { members: true } } } satisfies Prisma.ScoutLevelInclude;
const badgeCategoryInclude = { _count: { select: { badges: true } } } satisfies Prisma.BadgeCategoryInclude;
const activityCategoryInclude = { _count: { select: { events: true } } } satisfies Prisma.ActivityCategoryInclude;

export type CouncilWithCounts = Prisma.CouncilGetPayload<{ include: typeof councilInclude }>;
export type TroopWithRelations = Prisma.TroopGetPayload<{ include: typeof troopInclude }>;
export type ScoutLevelWithCount = Prisma.ScoutLevelGetPayload<{ include: typeof scoutLevelInclude }>;
export type BadgeCategoryWithCount = Prisma.BadgeCategoryGetPayload<{ include: typeof badgeCategoryInclude }>;
export type ActivityCategoryWithCount = Prisma.ActivityCategoryGetPayload<{ include: typeof activityCategoryInclude }>;

export const organizationsRepository = {
  // Councils
  listCouncils() {
    return prisma.council.findMany({ include: councilInclude, orderBy: { name: 'asc' } });
  },
  findCouncilByName(name: string) {
    return prisma.council.findUnique({ where: { name } });
  },
  findCouncilById(id: string) {
    return prisma.council.findUnique({ where: { id }, include: councilInclude });
  },
  createCouncil(input: CreateCouncilInput) {
    return prisma.council.create({
      data: { name: input.name.trim(), description: input.description?.trim() || null },
      include: councilInclude,
    });
  },
  updateCouncil(id: string, input: UpdateCouncilInput) {
    return prisma.council.update({
      where: { id },
      data: { name: input.name.trim(), description: input.description?.trim() || null },
      include: councilInclude,
    });
  },
  deleteCouncil(id: string) {
    return prisma.council.delete({ where: { id } });
  },

  // Troops — `listTroops` is also consumed by 1.3's registration-form picker via
  // `TroopOption`; the widened fields here are additive and ignored there.
  listTroops() {
    return prisma.troop.findMany({ include: troopInclude, orderBy: { troopCode: 'asc' } });
  },
  findTroopByCode(troopCode: string) {
    return prisma.troop.findUnique({ where: { troopCode } });
  },
  findTroopById(id: string) {
    return prisma.troop.findUnique({ where: { id }, include: troopInclude });
  },
  createTroop(input: CreateTroopInput) {
    return prisma.troop.create({
      data: {
        troopCode: input.troopCode.trim(),
        name: input.name.trim(),
        councilId: input.councilId,
        leaderId: input.leaderId ?? null,
      },
      include: troopInclude,
    });
  },
  updateTroop(id: string, input: UpdateTroopInput) {
    return prisma.troop.update({
      where: { id },
      data: { name: input.name.trim(), councilId: input.councilId, leaderId: input.leaderId ?? null },
      include: troopInclude,
    });
  },
  deleteTroop(id: string) {
    return prisma.troop.delete({ where: { id } });
  },

  listTroopLeaderUsers() {
    return prisma.user.findMany({
      where: { isActive: true, userRoles: { some: { role: { name: 'troop_leader' } } } },
      orderBy: { fullName: 'asc' },
    });
  },

  // Scout Levels — `listScoutLevels` is also consumed by 1.3's registration-form picker.
  listScoutLevels() {
    return prisma.scoutLevel.findMany({ include: scoutLevelInclude, orderBy: { orderNumber: 'asc' } });
  },
  findScoutLevelByName(name: string) {
    return prisma.scoutLevel.findUnique({ where: { name } });
  },
  findScoutLevelById(id: string) {
    return prisma.scoutLevel.findUnique({ where: { id }, include: scoutLevelInclude });
  },
  createScoutLevel(input: CreateScoutLevelInput) {
    return prisma.scoutLevel.create({
      data: { name: input.name.trim(), description: input.description?.trim() || null, orderNumber: input.orderNumber },
      include: scoutLevelInclude,
    });
  },
  updateScoutLevel(id: string, input: UpdateScoutLevelInput) {
    return prisma.scoutLevel.update({
      where: { id },
      data: { name: input.name.trim(), description: input.description?.trim() || null, orderNumber: input.orderNumber },
      include: scoutLevelInclude,
    });
  },
  deleteScoutLevel(id: string) {
    return prisma.scoutLevel.delete({ where: { id } });
  },

  // Badge Categories
  listBadgeCategories() {
    return prisma.badgeCategory.findMany({ include: badgeCategoryInclude, orderBy: { name: 'asc' } });
  },
  findBadgeCategoryByName(name: string) {
    return prisma.badgeCategory.findUnique({ where: { name } });
  },
  findBadgeCategoryById(id: string) {
    return prisma.badgeCategory.findUnique({ where: { id }, include: badgeCategoryInclude });
  },
  createBadgeCategory(input: CreateCategoryInput) {
    return prisma.badgeCategory.create({
      data: { name: input.name.trim(), description: input.description?.trim() || null },
      include: badgeCategoryInclude,
    });
  },
  updateBadgeCategory(id: string, input: UpdateCategoryInput) {
    return prisma.badgeCategory.update({
      where: { id },
      data: { name: input.name.trim(), description: input.description?.trim() || null },
      include: badgeCategoryInclude,
    });
  },
  deleteBadgeCategory(id: string) {
    return prisma.badgeCategory.delete({ where: { id } });
  },

  // Activity Categories
  listActivityCategories() {
    return prisma.activityCategory.findMany({ include: activityCategoryInclude, orderBy: { name: 'asc' } });
  },
  findActivityCategoryByName(name: string) {
    return prisma.activityCategory.findUnique({ where: { name } });
  },
  findActivityCategoryById(id: string) {
    return prisma.activityCategory.findUnique({ where: { id }, include: activityCategoryInclude });
  },
  createActivityCategory(input: CreateCategoryInput) {
    return prisma.activityCategory.create({
      data: { name: input.name.trim(), description: input.description?.trim() || null },
      include: activityCategoryInclude,
    });
  },
  updateActivityCategory(id: string, input: UpdateCategoryInput) {
    return prisma.activityCategory.update({
      where: { id },
      data: { name: input.name.trim(), description: input.description?.trim() || null },
      include: activityCategoryInclude,
    });
  },
  deleteActivityCategory(id: string) {
    return prisma.activityCategory.delete({ where: { id } });
  },
};
