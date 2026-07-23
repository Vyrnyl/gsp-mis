import { prisma } from '../../config/prisma';

export const dashboardRepository = {
  countCouncils() {
    return prisma.council.count();
  },

  countTroops() {
    return prisma.troop.count();
  },

  countMembers() {
    return prisma.member.count();
  },

  countMembersByStatus(statusName: string) {
    return prisma.member.count({ where: { status: { name: statusName } } });
  },

  /** One row per seeded status, with how many members currently hold it. */
  statusBreakdown() {
    return prisma.memberStatus.findMany({
      include: { _count: { select: { members: true } } },
    });
  },

  membersCreatedSince(since: Date) {
    return prisma.member.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
  },

  recentMemberRegistrations(limit: number) {
    return prisma.member.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { troop: true },
    });
  },

  /** Only approve/reject are audited today (feature 1.4) — registration itself isn't. */
  recentAuditLogs(limit: number) {
    return prisma.auditLog.findMany({
      where: { entityType: 'member', action: { in: ['member.approve', 'member.reject'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  findMembersByIds(ids: string[]) {
    return prisma.member.findMany({ where: { id: { in: ids } } });
  },

  listTroopsWithLeaderAndCount() {
    return prisma.troop.findMany({
      include: { leader: true, _count: { select: { members: true } } },
      orderBy: { troopCode: 'asc' },
    });
  },

  /** Org-wide scout-level composition — one council today, so this doubles as the
   *  Executive Council view (dashboard.service.ts documents the simplification). */
  scoutLevelBreakdown() {
    return prisma.scoutLevel.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { orderNumber: 'asc' },
    });
  },

  /** A leader can only be assigned to a troop by an admin (1.6) — self-signup does not
   *  persist this link, so a `troop_leader` account may genuinely have none yet. */
  findTroopByLeaderId(leaderId: string) {
    return prisma.troop.findFirst({ where: { leaderId } });
  },

  listTroopRoster(troopId: string) {
    return prisma.member.findMany({
      where: { troopId },
      include: { status: true, scoutLevel: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  },
};
