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

  /** Used by `GET /auth/me` — `requireAuth` already verified the token, this resolves the identity. */
  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
  },

  /**
   * Creates the user and its single role assignment atomically — never one without
   * the other. `isActive` defaults to the schema's `true` when omitted (admin signup,
   * settings-panel-created users); self-signup passes `false` explicitly for roles
   * that require administrator approval before first login.
   */
  createUserWithRole(
    data: { fullName: string; email: string; passwordHash: string; isActive?: boolean },
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

  /**
   * A reset means the account was inaccessible or compromised, so every existing
   * session is invalidated too — stronger than 3.5's self-service changePassword,
   * which trusts the caller already holds a valid session.
   */
  revokeAllRefreshTokensForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  },

  /** Invalidates any outstanding reset links so only the most recently requested one can ever be used. */
  invalidateActivePasswordResetTokens(userId: string) {
    return prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  },

  findActivePasswordResetTokenByHash(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  markPasswordResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },
};
