import { beforeEach, describe, expect, it, vi } from 'vitest';

import { organizationsRepository } from '../src/modules/organizations/organizations.repository';
import { organizationsService } from '../src/modules/organizations/organizations.service';
import { createBadgeCategorySchema } from '../src/modules/organizations/organizations.schema';
import type {
  CreateBadgeCategoryInput,
  CreateCategoryInput,
  CreateCouncilInput,
  CreateScoutLevelInput,
  CreateTroopInput,
} from '../src/modules/organizations/organizations.schema';

const COUNCIL = {
  id: 'council-1',
  name: 'Catanduanes Council',
  description: 'Provincial council',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  _count: { troops: 0, members: 0 },
};

const LEADER_USER = { id: 'user-leader-1', fullName: 'Liza Bagadiong', email: 'leader.virac@gsp-catanduanes.ph' };

const TROOP = {
  id: 'troop-1',
  troopCode: 'CAT-VIR-012',
  name: 'Troop 12 — Virac',
  councilId: COUNCIL.id,
  leaderId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  council: COUNCIL,
  leader: null,
  _count: { members: 0 },
};

const SCOUT_LEVEL = {
  id: 'level-1',
  name: 'Twinkler',
  description: 'Ages 4–6',
  orderNumber: 1,
  _count: { members: 0 },
};

const BADGE_CATEGORY = {
  id: 'badge-cat-1',
  name: 'Outdoor Skills',
  description: null,
  icon: 'compass',
  _count: { badges: 0 },
};
const ACTIVITY_CATEGORY = { id: 'activity-cat-1', name: 'Camping', description: null, _count: { events: 0 } };

describe('organizationsService councils', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists councils with troop/member counts mapped to the DTO', async () => {
    vi.spyOn(organizationsRepository, 'listCouncils').mockResolvedValue([
      { ...COUNCIL, _count: { troops: 3, members: 12 } },
    ] as never);

    const result = await organizationsService.listCouncils();

    expect(result.councils).toEqual([
      { id: COUNCIL.id, name: COUNCIL.name, description: COUNCIL.description, troopCount: 3, memberCount: 12, createdAt: COUNCIL.createdAt.toISOString() },
    ]);
  });

  it('rejects creating a council with a name already in use', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilByName').mockResolvedValue(COUNCIL as never);

    const input: CreateCouncilInput = { name: 'Catanduanes Council' };
    await expect(organizationsService.createCouncil(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates a council when the name is free', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilByName').mockResolvedValue(null);
    const createSpy = vi.spyOn(organizationsRepository, 'createCouncil').mockResolvedValue(COUNCIL as never);

    const input: CreateCouncilInput = { name: 'Albay Council' };
    const result = await organizationsService.createCouncil(input);

    expect(createSpy).toHaveBeenCalledWith(input);
    expect(result.name).toBe(COUNCIL.name);
  });

  it('rejects updating a council that does not exist', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(null);

    await expect(organizationsService.updateCouncil('missing', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('blocks deleting a council that still has troops or members', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue({
      ...COUNCIL,
      _count: { troops: 3, members: 12 },
    } as never);

    await expect(organizationsService.deleteCouncil(COUNCIL.id)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes a council with no troops or members', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(COUNCIL as never);
    const deleteSpy = vi.spyOn(organizationsRepository, 'deleteCouncil').mockResolvedValue(undefined as never);

    await organizationsService.deleteCouncil(COUNCIL.id);

    expect(deleteSpy).toHaveBeenCalledWith(COUNCIL.id);
  });
});

describe('organizationsService troops', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists troops with council/leader names and member counts mapped to the DTO', async () => {
    vi.spyOn(organizationsRepository, 'listTroops').mockResolvedValue([
      { ...TROOP, leader: LEADER_USER, _count: { members: 6 } },
    ] as never);

    const result = await organizationsService.listTroops();

    expect(result.troops[0]).toMatchObject({
      troopCode: TROOP.troopCode,
      councilName: COUNCIL.name,
      leaderName: LEADER_USER.fullName,
      memberCount: 6,
    });
  });

  it('rejects creating a troop under an unknown council', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(null);

    const input: CreateTroopInput = { troopCode: 'NEW-001', name: 'New Troop', councilId: 'missing-council' };
    await expect(organizationsService.createTroop(input)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects assigning a leader who does not hold the Troop Leader role', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(COUNCIL as never);
    vi.spyOn(organizationsRepository, 'listTroopLeaderUsers').mockResolvedValue([LEADER_USER] as never);

    const input: CreateTroopInput = { troopCode: 'NEW-001', name: 'New Troop', councilId: COUNCIL.id, leaderId: 'not-a-leader' };
    await expect(organizationsService.createTroop(input)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects a duplicate troop code', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(COUNCIL as never);
    vi.spyOn(organizationsRepository, 'listTroopLeaderUsers').mockResolvedValue([]);
    vi.spyOn(organizationsRepository, 'findTroopByCode').mockResolvedValue(TROOP as never);

    const input: CreateTroopInput = { troopCode: TROOP.troopCode, name: 'New Troop', councilId: COUNCIL.id };
    await expect(organizationsService.createTroop(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('blocks deleting a troop that still has members', async () => {
    vi.spyOn(organizationsRepository, 'findTroopById').mockResolvedValue({
      ...TROOP,
      leader: null,
      _count: { members: 3 },
    } as never);

    await expect(organizationsService.deleteTroop(TROOP.id)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes a troop with no members', async () => {
    vi.spyOn(organizationsRepository, 'findTroopById').mockResolvedValue({
      ...TROOP,
      leader: null,
      _count: { members: 0 },
    } as never);
    const deleteSpy = vi.spyOn(organizationsRepository, 'deleteTroop').mockResolvedValue(undefined as never);

    await organizationsService.deleteTroop(TROOP.id);

    expect(deleteSpy).toHaveBeenCalledWith(TROOP.id);
  });

  it('lists troop-leader users for the assignment picker', async () => {
    vi.spyOn(organizationsRepository, 'listTroopLeaderUsers').mockResolvedValue([LEADER_USER] as never);

    const result = await organizationsService.listTroopLeaders();

    expect(result.troopLeaders).toEqual([LEADER_USER]);
  });

  it('rejects assigning a leader who already leads a different troop', async () => {
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(COUNCIL as never);
    vi.spyOn(organizationsRepository, 'listTroopLeaderUsers').mockResolvedValue([LEADER_USER] as never);
    vi.spyOn(organizationsRepository, 'findTroopByLeaderId').mockResolvedValue(TROOP as never);

    const input: CreateTroopInput = {
      troopCode: 'NEW-001',
      name: 'New Troop',
      councilId: COUNCIL.id,
      leaderId: LEADER_USER.id,
    };
    await expect(organizationsService.createTroop(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('allows keeping a troop’s own current leader on update', async () => {
    vi.spyOn(organizationsRepository, 'findTroopById').mockResolvedValue(TROOP as never);
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(COUNCIL as never);
    vi.spyOn(organizationsRepository, 'listTroopLeaderUsers').mockResolvedValue([LEADER_USER] as never);
    vi.spyOn(organizationsRepository, 'findTroopByLeaderId').mockResolvedValue({ ...TROOP, id: TROOP.id } as never);
    const updateSpy = vi
      .spyOn(organizationsRepository, 'updateTroop')
      .mockResolvedValue({ ...TROOP, leader: LEADER_USER } as never);

    await organizationsService.updateTroop(TROOP.id, {
      name: TROOP.name,
      councilId: COUNCIL.id,
      leaderId: LEADER_USER.id,
    });

    expect(updateSpy).toHaveBeenCalled();
  });

  it('rejects assigning a leader on update who already leads a different troop', async () => {
    vi.spyOn(organizationsRepository, 'findTroopById').mockResolvedValue(TROOP as never);
    vi.spyOn(organizationsRepository, 'findCouncilById').mockResolvedValue(COUNCIL as never);
    vi.spyOn(organizationsRepository, 'listTroopLeaderUsers').mockResolvedValue([LEADER_USER] as never);
    vi.spyOn(organizationsRepository, 'findTroopByLeaderId').mockResolvedValue({ ...TROOP, id: 'other-troop' } as never);

    await expect(
      organizationsService.updateTroop(TROOP.id, {
        name: TROOP.name,
        councilId: COUNCIL.id,
        leaderId: LEADER_USER.id,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('organizationsService scout levels', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('rejects a duplicate scout level name', async () => {
    vi.spyOn(organizationsRepository, 'findScoutLevelByName').mockResolvedValue(SCOUT_LEVEL as never);

    const input: CreateScoutLevelInput = { name: 'Twinkler', orderNumber: 1 };
    await expect(organizationsService.createScoutLevel(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('blocks deleting a scout level still assigned to members', async () => {
    vi.spyOn(organizationsRepository, 'findScoutLevelById').mockResolvedValue({
      ...SCOUT_LEVEL,
      _count: { members: 4 },
    } as never);

    await expect(organizationsService.deleteScoutLevel(SCOUT_LEVEL.id)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes a scout level with no members assigned', async () => {
    vi.spyOn(organizationsRepository, 'findScoutLevelById').mockResolvedValue(SCOUT_LEVEL as never);
    const deleteSpy = vi.spyOn(organizationsRepository, 'deleteScoutLevel').mockResolvedValue(undefined as never);

    await organizationsService.deleteScoutLevel(SCOUT_LEVEL.id);

    expect(deleteSpy).toHaveBeenCalledWith(SCOUT_LEVEL.id);
  });
});

describe('organizationsService badge categories', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('rejects a duplicate badge category name', async () => {
    vi.spyOn(organizationsRepository, 'findBadgeCategoryByName').mockResolvedValue(BADGE_CATEGORY as never);

    const input: CreateBadgeCategoryInput = { name: 'Outdoor Skills', icon: 'compass' };
    await expect(organizationsService.createBadgeCategory(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects an icon key outside the curated set', () => {
    const result = createBadgeCategorySchema.safeParse({ name: 'Outdoor Skills', icon: 'FaCampground' });
    expect(result.success).toBe(false);
  });

  it('defaults the icon when the client omits it', () => {
    const result = createBadgeCategorySchema.parse({ name: 'Outdoor Skills' });
    expect(result.icon).toBe('award');
  });

  it('blocks deleting a badge category still used by badges', async () => {
    vi.spyOn(organizationsRepository, 'findBadgeCategoryById').mockResolvedValue({
      ...BADGE_CATEGORY,
      _count: { badges: 2 },
    } as never);

    await expect(organizationsService.deleteBadgeCategory(BADGE_CATEGORY.id)).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('organizationsService activity categories', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('rejects a duplicate activity category name', async () => {
    vi.spyOn(organizationsRepository, 'findActivityCategoryByName').mockResolvedValue(ACTIVITY_CATEGORY as never);

    const input: CreateCategoryInput = { name: 'Camping' };
    await expect(organizationsService.createActivityCategory(input)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('blocks deleting an activity category still used by events', async () => {
    vi.spyOn(organizationsRepository, 'findActivityCategoryById').mockResolvedValue({
      ...ACTIVITY_CATEGORY,
      _count: { events: 1 },
    } as never);

    await expect(organizationsService.deleteActivityCategory(ACTIVITY_CATEGORY.id)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('deletes an activity category with no events using it', async () => {
    vi.spyOn(organizationsRepository, 'findActivityCategoryById').mockResolvedValue(ACTIVITY_CATEGORY as never);
    const deleteSpy = vi.spyOn(organizationsRepository, 'deleteActivityCategory').mockResolvedValue(undefined as never);

    await organizationsService.deleteActivityCategory(ACTIVITY_CATEGORY.id);

    expect(deleteSpy).toHaveBeenCalledWith(ACTIVITY_CATEGORY.id);
  });
});
