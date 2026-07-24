import { prisma } from '../../config/prisma';

export const analyticsRepository = {
  listMembers() {
    return prisma.member.findMany({
      select: { id: true, createdAt: true, troopId: true, status: { select: { name: true } } },
    });
  },

  // One row per event, with just enough nested detail to drive attendance,
  // participation and per-troop attendance rate without a second round trip.
  listEventsWithDetail() {
    return prisma.event.findMany({
      select: {
        id: true,
        title: true,
        eventDate: true,
        registrations: { select: { id: true } },
        attendanceRecords: { select: { attendanceStatus: true, member: { select: { troopId: true } } } },
      },
      orderBy: { eventDate: 'desc' },
    });
  },

  listBadgeCatalog() {
    return prisma.badge.findMany({ select: { id: true, name: true } });
  },

  listMemberBadges() {
    return prisma.memberBadge.findMany({
      select: { id: true, badgeId: true, status: true, member: { select: { troopId: true } } },
    });
  },

  listTroops() {
    return prisma.troop.findMany({ select: { id: true, name: true } });
  },

  totalIncome() {
    return prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'paid' } });
  },

  totalExpenses() {
    return prisma.expense.aggregate({ _sum: { amount: true } });
  },

  paymentsSince(date: Date) {
    return prisma.payment.findMany({
      where: { status: 'paid', paymentDate: { gte: date } },
      select: { paymentDate: true, amount: true },
    });
  },

  expensesSince(date: Date) {
    return prisma.expense.findMany({
      where: { expenseDate: { gte: date } },
      select: { expenseDate: true, amount: true },
    });
  },
};
