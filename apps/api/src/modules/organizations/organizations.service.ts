import { ApiError } from '../../shared/utils/api-error';
import type {
  ActivityCategoryWithCount,
  BadgeCategoryWithCount,
  CouncilWithCounts,
  ScoutLevelWithCount,
  TroopWithRelations,
} from './organizations.repository';
import { organizationsRepository } from './organizations.repository';
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
import type {
  ActivityCategoryDto,
  BadgeCategoryDto,
  CouncilDto,
  ListActivityCategoriesResponseBody,
  ListBadgeCategoriesResponseBody,
  ListCouncilsResponseBody,
  ListScoutLevelsResponseBody,
  ListTroopLeadersResponseBody,
  ListTroopsResponseBody,
  ScoutLevelDto,
  TroopDto,
} from './organizations.types';

function toCouncilDto(council: CouncilWithCounts): CouncilDto {
  return {
    id: council.id,
    name: council.name,
    description: council.description,
    troopCount: council._count.troops,
    memberCount: council._count.members,
    createdAt: council.createdAt.toISOString(),
  };
}

function toTroopDto(troop: TroopWithRelations): TroopDto {
  return {
    id: troop.id,
    troopCode: troop.troopCode,
    name: troop.name,
    councilId: troop.councilId,
    councilName: troop.council.name,
    leaderId: troop.leaderId,
    leaderName: troop.leader?.fullName ?? null,
    memberCount: troop._count.members,
    createdAt: troop.createdAt.toISOString(),
  };
}

function toScoutLevelDto(level: ScoutLevelWithCount): ScoutLevelDto {
  return {
    id: level.id,
    name: level.name,
    description: level.description,
    orderNumber: level.orderNumber,
    usageCount: level._count.members,
  };
}

function toBadgeCategoryDto(category: BadgeCategoryWithCount): BadgeCategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    usageCount: category._count.badges,
  };
}

function toActivityCategoryDto(category: ActivityCategoryWithCount): ActivityCategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    usageCount: category._count.events,
  };
}

async function requireCouncilExists(id: string): Promise<void> {
  const council = await organizationsRepository.findCouncilById(id);
  if (!council) throw ApiError.badRequest('Selected council does not exist.');
}

async function requireLeaderIsTroopLeader(leaderId: string | undefined): Promise<void> {
  if (!leaderId) return;
  const leaders = await organizationsRepository.listTroopLeaderUsers();
  if (!leaders.some((leader) => leader.id === leaderId)) {
    throw ApiError.badRequest('Selected leader is not a Troop Leader.');
  }
}

export const organizationsService = {
  // Councils
  async listCouncils(): Promise<ListCouncilsResponseBody> {
    const councils = await organizationsRepository.listCouncils();
    return { councils: councils.map(toCouncilDto) };
  },

  async createCouncil(input: CreateCouncilInput): Promise<CouncilDto> {
    const existing = await organizationsRepository.findCouncilByName(input.name.trim());
    if (existing) throw ApiError.conflict('A council with this name already exists.');
    const created = await organizationsRepository.createCouncil(input);
    return toCouncilDto(created);
  },

  async updateCouncil(id: string, input: UpdateCouncilInput): Promise<CouncilDto> {
    const council = await organizationsRepository.findCouncilById(id);
    if (!council) throw ApiError.notFound('Council not found.');

    const existing = await organizationsRepository.findCouncilByName(input.name.trim());
    if (existing && existing.id !== id) throw ApiError.conflict('A council with this name already exists.');

    const updated = await organizationsRepository.updateCouncil(id, input);
    return toCouncilDto(updated);
  },

  async deleteCouncil(id: string): Promise<void> {
    const council = await organizationsRepository.findCouncilById(id);
    if (!council) throw ApiError.notFound('Council not found.');
    if (council._count.troops > 0 || council._count.members > 0) {
      throw ApiError.conflict('Reassign this council’s troops and members before deleting it.');
    }
    await organizationsRepository.deleteCouncil(id);
  },

  // Troops
  async listTroops(): Promise<ListTroopsResponseBody> {
    const troops = await organizationsRepository.listTroops();
    return { troops: troops.map(toTroopDto) };
  },

  async createTroop(input: CreateTroopInput): Promise<TroopDto> {
    await requireCouncilExists(input.councilId);
    await requireLeaderIsTroopLeader(input.leaderId);

    const existing = await organizationsRepository.findTroopByCode(input.troopCode.trim());
    if (existing) throw ApiError.conflict('A troop with this code already exists.');

    const created = await organizationsRepository.createTroop(input);
    return toTroopDto(created);
  },

  async updateTroop(id: string, input: UpdateTroopInput): Promise<TroopDto> {
    const troop = await organizationsRepository.findTroopById(id);
    if (!troop) throw ApiError.notFound('Troop not found.');

    await requireCouncilExists(input.councilId);
    await requireLeaderIsTroopLeader(input.leaderId);

    const updated = await organizationsRepository.updateTroop(id, input);
    return toTroopDto(updated);
  },

  async deleteTroop(id: string): Promise<void> {
    const troop = await organizationsRepository.findTroopById(id);
    if (!troop) throw ApiError.notFound('Troop not found.');
    if (troop._count.members > 0) {
      throw ApiError.conflict('Reassign this troop’s members before deleting it.');
    }
    await organizationsRepository.deleteTroop(id);
  },

  async listTroopLeaders(): Promise<ListTroopLeadersResponseBody> {
    const leaders = await organizationsRepository.listTroopLeaderUsers();
    return { troopLeaders: leaders.map((leader) => ({ id: leader.id, fullName: leader.fullName, email: leader.email })) };
  },

  // Scout Levels
  async listScoutLevels(): Promise<ListScoutLevelsResponseBody> {
    const levels = await organizationsRepository.listScoutLevels();
    return { scoutLevels: levels.map(toScoutLevelDto) };
  },

  async createScoutLevel(input: CreateScoutLevelInput): Promise<ScoutLevelDto> {
    const existing = await organizationsRepository.findScoutLevelByName(input.name.trim());
    if (existing) throw ApiError.conflict('A scout level with this name already exists.');
    const created = await organizationsRepository.createScoutLevel(input);
    return toScoutLevelDto(created);
  },

  async updateScoutLevel(id: string, input: UpdateScoutLevelInput): Promise<ScoutLevelDto> {
    const level = await organizationsRepository.findScoutLevelById(id);
    if (!level) throw ApiError.notFound('Scout level not found.');

    const existing = await organizationsRepository.findScoutLevelByName(input.name.trim());
    if (existing && existing.id !== id) throw ApiError.conflict('A scout level with this name already exists.');

    const updated = await organizationsRepository.updateScoutLevel(id, input);
    return toScoutLevelDto(updated);
  },

  async deleteScoutLevel(id: string): Promise<void> {
    const level = await organizationsRepository.findScoutLevelById(id);
    if (!level) throw ApiError.notFound('Scout level not found.');
    if (level._count.members > 0) {
      throw ApiError.conflict('Reassign members using this scout level before deleting it.');
    }
    await organizationsRepository.deleteScoutLevel(id);
  },

  // Badge Categories
  async listBadgeCategories(): Promise<ListBadgeCategoriesResponseBody> {
    const categories = await organizationsRepository.listBadgeCategories();
    return { badgeCategories: categories.map(toBadgeCategoryDto) };
  },

  async createBadgeCategory(input: CreateCategoryInput): Promise<BadgeCategoryDto> {
    const existing = await organizationsRepository.findBadgeCategoryByName(input.name.trim());
    if (existing) throw ApiError.conflict('A badge category with this name already exists.');
    const created = await organizationsRepository.createBadgeCategory(input);
    return toBadgeCategoryDto(created);
  },

  async updateBadgeCategory(id: string, input: UpdateCategoryInput): Promise<BadgeCategoryDto> {
    const category = await organizationsRepository.findBadgeCategoryById(id);
    if (!category) throw ApiError.notFound('Badge category not found.');

    const existing = await organizationsRepository.findBadgeCategoryByName(input.name.trim());
    if (existing && existing.id !== id) throw ApiError.conflict('A badge category with this name already exists.');

    const updated = await organizationsRepository.updateBadgeCategory(id, input);
    return toBadgeCategoryDto(updated);
  },

  async deleteBadgeCategory(id: string): Promise<void> {
    const category = await organizationsRepository.findBadgeCategoryById(id);
    if (!category) throw ApiError.notFound('Badge category not found.');
    if (category._count.badges > 0) {
      throw ApiError.conflict('Remove all badges using this category before deleting it.');
    }
    await organizationsRepository.deleteBadgeCategory(id);
  },

  // Activity Categories
  async listActivityCategories(): Promise<ListActivityCategoriesResponseBody> {
    const categories = await organizationsRepository.listActivityCategories();
    return { activityCategories: categories.map(toActivityCategoryDto) };
  },

  async createActivityCategory(input: CreateCategoryInput): Promise<ActivityCategoryDto> {
    const existing = await organizationsRepository.findActivityCategoryByName(input.name.trim());
    if (existing) throw ApiError.conflict('An activity category with this name already exists.');
    const created = await organizationsRepository.createActivityCategory(input);
    return toActivityCategoryDto(created);
  },

  async updateActivityCategory(id: string, input: UpdateCategoryInput): Promise<ActivityCategoryDto> {
    const category = await organizationsRepository.findActivityCategoryById(id);
    if (!category) throw ApiError.notFound('Activity category not found.');

    const existing = await organizationsRepository.findActivityCategoryByName(input.name.trim());
    if (existing && existing.id !== id) throw ApiError.conflict('An activity category with this name already exists.');

    const updated = await organizationsRepository.updateActivityCategory(id, input);
    return toActivityCategoryDto(updated);
  },

  async deleteActivityCategory(id: string): Promise<void> {
    const category = await organizationsRepository.findActivityCategoryById(id);
    if (!category) throw ApiError.notFound('Activity category not found.');
    if (category._count.events > 0) {
      throw ApiError.conflict('Remove all events using this category before deleting it.');
    }
    await organizationsRepository.deleteActivityCategory(id);
  },
};
