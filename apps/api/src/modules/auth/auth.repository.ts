import { prisma } from '../../config/prisma';
import type { RoleName } from '../../shared/constants/roles';

export const authRepository = {
  /** Includes the relational role join so the service can enforce one-role-per-user. */
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: true } } },
    });
  },

  findRoleByName(name: RoleName) {
    return prisma.role.findUnique({ where: { name } });
  },

  /** Creates the user and its single role assignment atomically — never one without the other. */
  createUserWithRole(
    data: { fullName: string; email: string; passwordHash: string },
    roleId: string,
  ) {
    return prisma.user.create({
      data: {
        ...data,
        userRoles: { create: { roleId } },
      },
      include: { userRoles: { include: { role: true } } },
    });
  },

  updateLastLogin(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  },

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  },

  /** Excludes revoked or expired rows — a token that fails this lookup is rejected. */
  findActiveRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },
};
