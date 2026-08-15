import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type { CreateMemberInput, ListMembersQuery, UpdateMemberInput } from './members.schema';

const memberInclude = {
  status: true,
  troop: true,
  scoutLevel: true,
  school: true,
  profile: true,
  memberships: { orderBy: { startDate: 'desc' as const } },
} satisfies Prisma.MemberInclude;

export type MemberWithRelations = Prisma.MemberGetPayload<{ include: typeof memberInclude }>;

/**
 * `scopedTroopIds` is the Troop Leader's own led-troop scope (`undefined` for
 * admin/executive council — no restriction). Combined with client-supplied filters
 * via `AND` rather than overwriting `troopId`, so a Troop Leader filtering by a troop
 * they don't lead gets zero rows instead of leaking another troop's roster.
 */
function buildWhere(query: ListMembersQuery, scopedTroopIds?: string[]): Prisma.MemberWhereInput {
  const and: Prisma.MemberWhereInput[] = [];

  if (query.status) and.push({ status: { name: query.status } });
  if (query.memberType) and.push({ memberType: query.memberType });
  if (query.troopId) and.push({ troopId: query.troopId });
  if (scopedTroopIds !== undefined) and.push({ troopId: { in: scopedTroopIds } });

  if (query.search) {
    const term = query.search.trim();
    and.push({
      OR: [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { troop: { troopCode: { contains: term, mode: 'insensitive' } } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export const membersRepository = {
  async list(query: ListMembersQuery, scopedTroopIds?: string[]): Promise<{ rows: MemberWithRelations[]; total: number }> {
    const where = buildWhere(query, scopedTroopIds);
    const [rows, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: memberInclude,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.member.count({ where }),
    ]);
    return { rows, total };
  },

  findById(id: string) {
    return prisma.member.findUnique({ where: { id }, include: memberInclude });
  },

  findStatusIdByName(name: string) {
    return prisma.memberStatus.findUnique({ where: { name } });
  },

  findTroopById(id: string) {
    return prisma.troop.findUnique({ where: { id }, include: { council: true } });
  },

  findSchoolById(id: string) {
    return prisma.school.findUnique({ where: { id } });
  },

  findTroopIdsLedBy(userId: string) {
    return prisma.troop.findMany({ where: { leaderId: userId }, select: { id: true } });
  },

  /** Registration always starts `pending` — approval (feature 1.4) transitions it to active. */
  async create(input: CreateMemberInput, statusId: string, councilId: string | null) {
    const profileFields = {
      emergencyContactName: input.emergencyContactName?.trim() || null,
      emergencyContactPhone: input.emergencyContactPhone?.trim() || null,
      notes: input.notes?.trim() || null,
    };
    const hasProfile = Object.values(profileFields).some((value) => value !== null);

    return prisma.member.create({
      data: {
        memberType: input.memberType,
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        birthDate: new Date(input.birthDate),
        gender: input.gender,
        email: input.email?.trim() || null,
        phoneNumber: input.phoneNumber?.trim() || null,
        address: input.address?.trim() || null,
        membershipStatusId: statusId,
        troopId: input.troopId,
        councilId,
        scoutLevelId: input.memberType === 'scout' ? input.scoutLevelId : null,
        schoolId: input.schoolId ?? null,
        profile: hasProfile ? { create: profileFields } : undefined,
      },
      include: memberInclude,
    });
  },

  async update(id: string, input: UpdateMemberInput, councilId: string | null) {
    const profileFields = {
      emergencyContactName: input.emergencyContactName?.trim() || null,
      emergencyContactPhone: input.emergencyContactPhone?.trim() || null,
      notes: input.notes?.trim() || null,
    };

    return prisma.member.update({
      where: { id },
      data: {
        memberType: input.memberType,
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        birthDate: new Date(input.birthDate),
        gender: input.gender,
        email: input.email?.trim() || null,
        phoneNumber: input.phoneNumber?.trim() || null,
        address: input.address?.trim() || null,
        troopId: input.troopId,
        councilId,
        scoutLevelId: input.memberType === 'scout' ? input.scoutLevelId : null,
        schoolId: input.schoolId ?? null,
        profile: {
          upsert: { create: profileFields, update: profileFields },
        },
      },
      include: memberInclude,
    });
  },

  setStatus(id: string, statusId: string) {
    return prisma.member.update({ where: { id }, data: { membershipStatusId: statusId } });
  },

  /** Archiving stashes the current status so `restore` can bring it back exactly. */
  archive(id: string, archivedStatusId: string, currentStatusId: string) {
    return prisma.member.update({
      where: { id },
      data: { membershipStatusId: archivedStatusId, preArchiveStatusId: currentStatusId },
    });
  },

  /** Restoring clears the stash — an already-restored member has nothing to fall back to. */
  restore(id: string, statusId: string) {
    return prisma.member.update({
      where: { id },
      data: { membershipStatusId: statusId, preArchiveStatusId: null },
    });
  },

  /** Approval (feature 1.4) — stamps the reviewer alongside the status change. */
  approve(id: string, statusId: string, reviewerId: string) {
    return prisma.member.update({
      where: { id },
      data: { membershipStatusId: statusId, reviewedById: reviewerId, reviewedAt: new Date(), rejectionReason: null },
    });
  },

  reject(id: string, statusId: string, reviewerId: string, reason: string) {
    return prisma.member.update({
      where: { id },
      data: { membershipStatusId: statusId, reviewedById: reviewerId, reviewedAt: new Date(), rejectionReason: reason },
    });
  },

  async renew(id: string, startDate: string, endDate: string) {
    await prisma.membership.create({
      data: {
        memberId: id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        renewalDate: new Date(),
        status: 'active',
      },
    });
  },
};
