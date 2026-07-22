import { prisma } from '../../config/prisma';

/**
 * Health checks still go through a repository — all database access lives behind
 * this layer, with no exceptions (code-standards.md §6.4).
 */
export const healthRepository = {
  async ping(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },
};
