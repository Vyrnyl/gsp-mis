import { beforeEach, describe, expect, it, vi } from 'vitest';

import { membersRepository, type MemberWithRelations } from '../src/modules/members/members.repository';
import { membersService } from '../src/modules/members/members.service';
import type { CreateMemberInput, ListMembersQuery, UpdateMemberInput } from '../src/modules/members/members.schema';

const STATUS_PENDING = { id: 'status-pending', name: 'pending', description: null };
const STATUS_ACTIVE = { id: 'status-active', name: 'active', description: null };
const STATUS_ARCHIVED = { id: 'status-archived', name: 'archived', description: null };

const TROOP = {
  id: 'troop-1',
  councilId: 'council-1',
  name: 'Troop 12 — Virac',
  troopCode: 'CAT-VIR-012',
  leaderId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  council: { id: 'council-1', name: 'Catanduanes Council', description: null, createdAt: new Date(), updatedAt: new Date() },
};

function buildMember(overrides: Partial<MemberWithRelations> = {}): MemberWithRelations {
  return {
    id: 'member-1',
    memberType: 'scout',
    firstName: 'Althea',
    middleName: null,
    lastName: 'Ramos',
    birthDate: new Date('2009-03-14T00:00:00Z'),
    gender: 'female',
    email: 'althea@example.com',
    phoneNumber: null,
    address: null,
    membershipStatusId: STATUS_ACTIVE.id,
    troopId: TROOP.id,
    councilId: TROOP.councilId,
    scoutLevelId: 'level-1',
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    status: STATUS_ACTIVE,
    troop: { id: TROOP.id, troopCode: TROOP.troopCode, name: TROOP.name },
    scoutLevel: { id: 'level-1', name: 'Senior Girl Scout' },
    profile: null,
    memberships: [],
    ...overrides,
  } as MemberWithRelations;
}

const CREATE_SCOUT_INPUT: CreateMemberInput = {
  memberType: 'scout',
  firstName: 'Josie',
  lastName: 'Marasigan',
  birthDate: '2014-03-14',
  gender: 'female',
  troopId: TROOP.id,
  scoutLevelId: 'level-3',
};

describe('membersService.list', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('maps rows to summaries and builds pagination meta', async () => {
    vi.spyOn(membersRepository, 'list').mockResolvedValue({ rows: [buildMember()], total: 1 });

    const query: ListMembersQuery = { page: 1, pageSize: 20 };
    const result = await membersService.list(query);

    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toMatchObject({ id: 'member-1', status: 'active', memberType: 'scout' });
    expect(result.meta).toMatchObject({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });
});

describe('membersService.getById', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('resolves the council name via the member troop', async () => {
    vi.spyOn(membersRepository, 'findById').mockResolvedValue(buildMember());
    vi.spyOn(membersRepository, 'findTroopById').mockResolvedValue(TROOP as never);

    const result = await membersService.getById('member-1');

    expect(result.councilName).toBe('Catanduanes Council');
    expect(result.memberships).toEqual([]);
  });

  it('rejects an unknown id', async () => {
    vi.spyOn(membersRepository, 'findById').mockResolvedValue(null);

    await expect(membersService.getById('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('membersService.create', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('registers a new member as pending', async () => {
    vi.spyOn(membersRepository, 'findTroopById').mockResolvedValue(TROOP as never);
    vi.spyOn(membersRepository, 'findStatusIdByName').mockResolvedValue(STATUS_PENDING);
    const createSpy = vi
      .spyOn(membersRepository, 'create')
      .mockResolvedValue(buildMember({ status: STATUS_PENDING, firstName: 'Josie', lastName: 'Marasigan' }));

    const result = await membersService.create(CREATE_SCOUT_INPUT);

    expect(createSpy).toHaveBeenCalledWith(CREATE_SCOUT_INPUT, STATUS_PENDING.id, TROOP.councilId);
    expect(result.status).toBe('pending');
  });

  it('rejects an unknown troop', async () => {
    vi.spyOn(membersRepository, 'findTroopById').mockResolvedValue(null);

    await expect(membersService.create(CREATE_SCOUT_INPUT)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('membersService.update', () => {
  beforeEach(() => vi.restoreAllMocks());

  const updateInput: UpdateMemberInput = { ...CREATE_SCOUT_INPUT, firstName: 'Josefina' };

  it('rejects updating a member that does not exist', async () => {
    vi.spyOn(membersRepository, 'findById').mockResolvedValue(null);

    await expect(membersService.update('missing', updateInput)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('membersService.archive / restore', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('archive sets the member status to archived', async () => {
    vi.spyOn(membersRepository, 'findById')
      .mockResolvedValueOnce(buildMember())
      .mockResolvedValueOnce(buildMember({ status: STATUS_ARCHIVED }));
    vi.spyOn(membersRepository, 'findStatusIdByName').mockResolvedValue(STATUS_ARCHIVED);
    vi.spyOn(membersRepository, 'findTroopById').mockResolvedValue(TROOP as never);
    const setStatusSpy = vi.spyOn(membersRepository, 'setStatus').mockResolvedValue({} as never);

    const result = await membersService.archive('member-1');

    expect(setStatusSpy).toHaveBeenCalledWith('member-1', STATUS_ARCHIVED.id);
    expect(result.status).toBe('archived');
  });

  it('restore rejects an unknown member', async () => {
    vi.spyOn(membersRepository, 'findById').mockResolvedValue(null);

    await expect(membersService.restore('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('membersService.renew', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('writes a new membership term and reactivates the member', async () => {
    vi.spyOn(membersRepository, 'findById')
      .mockResolvedValueOnce(buildMember({ status: { id: 'status-expired', name: 'expired', description: null } }))
      .mockResolvedValueOnce(buildMember({ status: STATUS_ACTIVE }));
    vi.spyOn(membersRepository, 'findTroopById').mockResolvedValue(TROOP as never);
    vi.spyOn(membersRepository, 'findStatusIdByName').mockResolvedValue(STATUS_ACTIVE);
    const renewSpy = vi.spyOn(membersRepository, 'renew').mockResolvedValue(undefined);
    const setStatusSpy = vi.spyOn(membersRepository, 'setStatus').mockResolvedValue({} as never);

    const result = await membersService.renew('member-1', { startDate: '2026-08-01', endDate: '2027-08-01' });

    expect(renewSpy).toHaveBeenCalledWith('member-1', '2026-08-01', '2027-08-01');
    expect(setStatusSpy).toHaveBeenCalledWith('member-1', STATUS_ACTIVE.id);
    expect(result.status).toBe('active');
  });
});
