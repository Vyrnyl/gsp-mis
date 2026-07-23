import { prisma } from '../../config/prisma';

export const organizationsRepository = {
  listTroops() {
    return prisma.troop.findMany({ include: { council: true }, orderBy: { troopCode: 'asc' } });
  },

  listScoutLevels() {
    return prisma.scoutLevel.findMany({ orderBy: { orderNumber: 'asc' } });
  },
};
