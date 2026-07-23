import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type { CreateMemberInput, ListMembersQuery, UpdateMemberInput } from './members.schema';

const memberInclude = {
  status: true,
  troop: true,
  scoutLevel: true,
  profile: true,
  memberships: { orderBy: { startDate: 'desc' as const } },
} satisfies Prisma.MemberInclude;

export type MemberWithRelations = Prisma.MemberGetPayload<{ include: typeof memberInclude }>;

function buildWhere(query: ListMembersQuery): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {};

  if (query.status) where.status = { name: query.status };
  if (query.memberType) where.memberType = query.memberType;
  if (query.troopId) where.troopId = query.troopId;

  if (query.search) {
    const term = query.search.trim();
    where.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { troop: { troopCode: { contains: term, mode: 'insensitive' } } },
    ];
  }

  return where;
}

export const membersRepository = {
  async list(query: ListMembersQuery): Promise<{ rows: MemberWithRelations[]; total: number }> {
    const where = buildWhere(query);
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
