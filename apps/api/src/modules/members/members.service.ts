import { writeAuditLog } from '../../shared/utils/audit-log';
import { ApiError } from '../../shared/utils/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/api-response';
import { notifyUser } from '../../shared/utils/notify';
import type { RoleName } from '../../shared/constants/roles';
import type { MemberWithRelations } from './members.repository';
import { membersRepository } from './members.repository';
import type {
  CreateMemberInput,
  ListMembersQuery,
  PendingMembersQuery,
  RenewMembershipInput,
  UpdateMemberInput,
} from './members.schema';
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

type RequestingUser = { id: string; role: RoleName };

/** Troop Leader is scoped to their own led troop; Admin/Executive Council see every troop. */
async function scopeToOwnTroop(user: RequestingUser): Promise<string[] | undefined> {
  if (user.role !== 'troop_leader') return undefined;
  const troops = await membersRepository.findTroopIdsLedBy(user.id);
  return troops.map((troop) => troop.id);
}

function requireTroopIdInScope(troopId: string | null, troopIds: string[] | undefined): void {
  if (troopIds !== undefined && (!troopId || !troopIds.includes(troopId))) {
    throw ApiError.forbidden('You can only manage members in your own troop.');
  }
}

export const membersService = {
  async list(query: ListMembersQuery, user: RequestingUser): Promise<{ members: MemberSummary[]; meta: PaginationMeta }> {
    const troopIds = await scopeToOwnTroop(user);
    const { rows, total } = await membersRepository.list(query, troopIds);
    return {
      members: rows.map(toSummary),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  },

  /**
   * `user` is omitted for internal reuse (archive/restore/renew/approve/reject's
   * trailing refetch after an already-authorized mutation) — those routes are either
   * role-gated away from Troop Leader entirely, or scope-checked earlier in the same
   * call. The `GET /:id` route itself always passes `user` and gets scoped.
   */
  async getById(id: string, user?: RequestingUser): Promise<MemberDetail> {
    const member = await requireMember(id);
    if (user) {
      const troopIds = await scopeToOwnTroop(user);
      requireTroopIdInScope(member.troopId, troopIds);
    }
    const councilName = member.troopId ? (await membersRepository.findTroopById(member.troopId))?.council.name ?? null : null;
    return toDetail(member, councilName);
  },

  /** New registrations always start `pending` — feature 1.4 approves/rejects them. */
  async create(input: CreateMemberInput, user: RequestingUser): Promise<MemberDetail> {
    const troop = await membersRepository.findTroopById(input.troopId);
    if (!troop) throw ApiError.badRequest('Selected troop does not exist.');

    const troopIds = await scopeToOwnTroop(user);
    requireTroopIdInScope(input.troopId, troopIds);

    const statusId = await requireStatusId('pending');
    const created = await membersRepository.create(input, statusId, troop.councilId);
    return toDetail(created, troop.council.name);
  },

  async update(id: string, input: UpdateMemberInput, user: RequestingUser): Promise<MemberDetail> {
    const existing = await requireMember(id);
    const troop = await membersRepository.findTroopById(input.troopId);
    if (!troop) throw ApiError.badRequest('Selected troop does not exist.');

    const troopIds = await scopeToOwnTroop(user);
    requireTroopIdInScope(existing.troopId, troopIds);
    requireTroopIdInScope(input.troopId, troopIds);

    const updated = await membersRepository.update(id, input, troop.councilId);
    return toDetail(updated, troop.council.name);
  },

  /** Stashes the member's current status so `restore` can bring back that exact status rather than forcing `active`. */
  async archive(id: string): Promise<MemberDetail> {
    const member = await requireMember(id);
    if (member.status.name === 'archived') return membersService.getById(id);
    const archivedStatusId = await requireStatusId('archived');
    await membersRepository.archive(id, archivedStatusId, member.membershipStatusId);
    return membersService.getById(id);
  },

  /** Falls back to `active` when there's no stashed status (e.g. a member archived before this was tracked). */
  async restore(id: string): Promise<MemberDetail> {
    const member = await requireMember(id);
    const statusId = member.preArchiveStatusId ?? (await requireStatusId('active'));
    await membersRepository.restore(id, statusId);
    return membersService.getById(id);
  },

  /** Writes a new `memberships` term rather than mutating the current one — history stays intact. */
  async renew(id: string, input: RenewMembershipInput, user: RequestingUser): Promise<MemberDetail> {
    const existing = await requireMember(id);
    const troopIds = await scopeToOwnTroop(user);
    requireTroopIdInScope(existing.troopId, troopIds);

    await membersRepository.renew(id, input.startDate, input.endDate);
    const activeStatusId = await requireStatusId('active');
    await membersRepository.setStatus(id, activeStatusId);
    return membersService.getById(id);
  },

  /** Queue for feature 1.4 — same paginated shape as `list`, status forced to `pending`. */
  async listPending(query: PendingMembersQuery): Promise<{ members: MemberSummary[]; meta: PaginationMeta }> {
    const { rows, total } = await membersRepository.list({ ...query, status: 'pending' } as ListMembersQuery);
    return {
      members: rows.map(toSummary),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  },

  async approve(id: string, reviewerId: string): Promise<MemberDetail> {
    const member = await requireMember(id);
    if (member.status.name !== 'pending') {
      throw ApiError.badRequest('Only pending registrations can be approved.');
    }
    const statusId = await requireStatusId('active');
    await membersRepository.approve(id, statusId, reviewerId);
    await writeAuditLog({ userId: reviewerId, action: 'member.approve', entityType: 'member', entityId: id });
    if (member.troop?.leaderId) {
      await notifyUser({
        userId: member.troop.leaderId,
        title: 'Registration approved',
        message: `${member.firstName} ${member.lastName}'s registration was approved.`,
      });
    }
    return membersService.getById(id);
  },

  async reject(id: string, reviewerId: string, reason: string): Promise<MemberDetail> {
    const member = await requireMember(id);
    if (member.status.name !== 'pending') {
      throw ApiError.badRequest('Only pending registrations can be rejected.');
    }
    const statusId = await requireStatusId('rejected');
    await membersRepository.reject(id, statusId, reviewerId, reason);
    await writeAuditLog({
      userId: reviewerId,
      action: 'member.reject',
      entityType: 'member',
      entityId: id,
      details: { reason },
    });
    if (member.troop?.leaderId) {
      await notifyUser({
        userId: member.troop.leaderId,
        title: 'Registration rejected',
        message: `${member.firstName} ${member.lastName}'s registration was rejected.`,
      });
    }
    return membersService.getById(id);
  },
};
