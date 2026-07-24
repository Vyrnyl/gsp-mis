import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import type { RoleName } from '../../shared/constants/roles';
import type { ListAuditLogsQuery, ListUsersQuery } from './settings.schema';

const userWithRoleInclude = {
  userRoles: { include: { role: true } },
} satisfies Prisma.UserInclude;

export type UserWithRole = Prisma.UserGetPayload<{ include: typeof userWithRoleInclude }>;

const auditLogWithUserInclude = {
  user: true,
} satisfies Prisma.AuditLogInclude;

export type AuditLogWithUser = Prisma.AuditLogGetPayload<{ include: typeof auditLogWithUserInclude }>;

function buildUsersWhere(query: ListUsersQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.role) where.userRoles = { some: { role: { name: query.role } } };
  if (query.search) {
    const term = query.search.trim();
    where.OR = [
      { fullName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  return where;
}

export const settingsRepository = {
  // System settings
  findAllSettings() {
    return prisma.systemSetting.findMany();
  },

  async upsertSettings(entries: Array<{ key: string; value: string }>): Promise<void> {
    await prisma.$transaction(
      entries.map((entry) =>
        prisma.systemSetting.upsert({
          where: { settingKey: entry.key },
          update: { settingValue: entry.value },
          create: { settingKey: entry.key, settingValue: entry.value },
        }),
      ),
    );
  },

  // Users
  async listUsers(query: ListUsersQuery): Promise<{ rows: UserWithRole[]; total: number }> {
    const where = buildUsersWhere(query);
    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: userWithRoleInclude,
        orderBy: { fullName: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    return { rows, total };
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: userWithRoleInclude });
  },

  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findRoleByName(name: RoleName) {
    return prisma.role.findUnique({ where: { name } });
  },

  countUsersByRole(roleName: RoleName, excludingUserId?: string) {
    return prisma.user.count({
      where: {
        id: excludingUserId ? { not: excludingUserId } : undefined,
        userRoles: { some: { role: { name: roleName } } },
      },
    });
  },

  countLedTroops(userId: string) {
    return prisma.troop.count({ where: { leaderId: userId } });
  },

  createUserWithRole(data: { fullName: string; email: string; phoneNumber: string | null; passwordHash: string }, roleId: string) {
    return prisma.user.create({
      data: { ...data, userRoles: { create: { roleId } } },
      include: userWithRoleInclude,
    });
  },

  /** Replaces the user's single role row atomically alongside the profile fields. */
  updateUserAndRole(
    id: string,
    data: { fullName: string; email: string; phoneNumber: string | null },
    roleId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      return tx.user.update({
        where: { id },
        data: { ...data, userRoles: { create: { roleId } } },
        include: userWithRoleInclude,
      });
    });
  },

  setUserActive(id: string, isActive: boolean) {
    return prisma.user.update({ where: { id }, data: { isActive }, include: userWithRoleInclude });
  },

  setPasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  },

  deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  // Audit log
  async listAuditLogs(query: ListAuditLogsQuery): Promise<{ rows: AuditLogWithUser[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { action: { contains: term, mode: 'insensitive' } },
        { user: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: auditLogWithUserInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { rows, total };
  },

  findLatestBackupLog() {
    return prisma.auditLog.findFirst({
      where: { entityType: 'system', action: 'backup.run' },
      include: auditLogWithUserInclude,
      orderBy: { createdAt: 'desc' },
    });
  },
};
