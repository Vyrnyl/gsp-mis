import { organizationsRepository } from './organizations.repository';
import type { ListScoutLevelsResponseBody, ListTroopsResponseBody } from './organizations.types';

/**
 * Minimal read-only lookups pulled forward from feature 1.6 (Organization
 * Management) — 1.3's member registration form needs a troop/scout-level picker
 * before 1.6's own CRUD screens exist. Full council/troop CRUD stays in 1.6.
 */
export const organizationsService = {
  async listTroops(): Promise<ListTroopsResponseBody> {
    const troops = await organizationsRepository.listTroops();
    return {
      troops: troops.map((troop) => ({
        id: troop.id,
        troopCode: troop.troopCode,
        name: troop.name,
        councilId: troop.councilId,
        councilName: troop.council.name,
      })),
    };
  },

  async listScoutLevels(): Promise<ListScoutLevelsResponseBody> {
    const scoutLevels = await organizationsRepository.listScoutLevels();
    return {
      scoutLevels: scoutLevels.map((level) => ({
        id: level.id,
        name: level.name,
        orderNumber: level.orderNumber,
      })),
    };
  },
};
