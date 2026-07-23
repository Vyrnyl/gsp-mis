import { ApiError } from '../../shared/utils/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/api-response';
import type { MemberWithRelations } from './members.repository';
import { membersRepository } from './members.repository';
import type { CreateMemberInput, ListMembersQuery, RenewMembershipInput, UpdateMemberInput } from './members.schema';
import type { MemberDetail, MemberSummary } from './members.types';

function toSummary(member: MemberWithRelations): MemberSummary {
  return {
    id: member.id,
    memberType: member.memberType,
    firstName: member.firstName,
    middleName: member.middleName,
    lastName: member.lastName,
    email: member.email,
    status: member.status.name as MemberSummary['status'],
    troop: member.troop ? { id: member.troop.id, troopCode: member.troop.troopCode, name: member.troop.name } : null,
    scoutLevel: member.scoutLevel ? { id: member.scoutLevel.id, name: member.scoutLevel.name } : null,
    createdAt: member.createdAt.toISOString(),
  };
}

function toDetail(member: MemberWithRelations, councilName: string | null): MemberDetail {
  return {
    ...toSummary(member),
    birthDate: member.birthDate ? member.birthDate.toISOString().slice(0, 10) : null,
    gender: member.gender,
    phoneNumber: member.phoneNumber,
    address: member.address,
    councilName,
    emergencyContactName: member.profile?.emergencyContactName ?? null,
    emergencyContactPhone: member.profile?.emergencyContactPhone ?? null,
    notes: member.profile?.notes ?? null,
    rejectionReason: member.rejectionReason,
    memberships: member.memberships.map((term) => ({
      id: term.id,
      startDate: term.startDate.toISOString().slice(0, 10),
      endDate: term.endDate.toISOString().slice(0, 10),
      renewalDate: term.renewalDate ? term.renewalDate.toISOString().slice(0, 10) : null,
      status: term.status,
    })),
  };
}

async function requireStatusId(name: string): Promise<string> {
  const status = await membersRepository.findStatusIdByName(name);
  if (!status) throw ApiError.internal(`Member status "${name}" is not seeded.`);
  return status.id;
}

async function requireMember(id: string): Promise<MemberWithRelations> {
  const member = await membersRepository.findById(id);
  if (!member) throw ApiError.notFound('Member not found.');
  return member;
}

export const membersService = {
  async list(query: ListMembersQuery): Promise<{ members: MemberSummary[]; meta: PaginationMeta }> {
    const { rows, total } = await membersRepository.list(query);
    return {
      members: rows.map(toSummary),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  },

  async getById(id: string): Promise<MemberDetail> {
    const member = await requireMember(id);
    const councilName = member.troopId ? (await membersRepository.findTroopById(member.troopId))?.council.name ?? null : null;
    return toDetail(member, councilName);
  },

  /** New registrations always start `pending` — feature 1.4 approves/rejects them. */
  async create(input: CreateMemberInput): Promise<MemberDetail> {
    const troop = await membersRepository.findTroopById(input.troopId);
    if (!troop) throw ApiError.badRequest('Selected troop does not exist.');

    const statusId = await requireStatusId('pending');
    const created = await membersRepository.create(input, statusId, troop.councilId);
    return toDetail(created, troop.council.name);
  },

  async update(id: string, input: UpdateMemberInput): Promise<MemberDetail> {
    await requireMember(id);
    const troop = await membersRepository.findTroopById(input.troopId);
    if (!troop) throw ApiError.badRequest('Selected troop does not exist.');

    const updated = await membersRepository.update(id, input, troop.councilId);
    return toDetail(updated, troop.council.name);
  },

  async archive(id: string): Promise<MemberDetail> {
    await requireMember(id);
    const statusId = await requireStatusId('archived');
    await membersRepository.setStatus(id, statusId);
    return membersService.getById(id);
  },

  async restore(id: string): Promise<MemberDetail> {
    await requireMember(id);
    const statusId = await requireStatusId('active');
    await membersRepository.setStatus(id, statusId);
    return membersService.getById(id);
  },

  /** Writes a new `memberships` term rather than mutating the current one — history stays intact. */
  async renew(id: string, input: RenewMembershipInput): Promise<MemberDetail> {
    await requireMember(id);
    await membersRepository.renew(id, input.startDate, input.endDate);
    const activeStatusId = await requireStatusId('active');
    await membersRepository.setStatus(id, activeStatusId);
    return membersService.getById(id);
  },
};
