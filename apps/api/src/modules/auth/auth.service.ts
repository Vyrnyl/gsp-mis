import { createHash } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { getTokenExpiry, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { verifyPassword } from '../../shared/utils/password';
import type { RoleName } from '../../shared/constants/roles';
import { authRepository } from './auth.repository';
import type { LoginInput, RefreshInput } from './auth.schema';
import type { AuthTokens, AuthUser, LoginResponseBody, RefreshResponseBody } from './auth.types';

type UserWithRoles = Prisma.UserGetPayload<{ include: { userRoles: { include: { role: true } } } }>;

/** Refresh tokens are high-entropy JWTs, not human passwords — a fast hash is correct here, bcrypt is not. */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Enforces the one-role-per-user invariant (build-plan.md, settled decision #5) on every read, not just at write time. */
function resolveSingleRole(user: UserWithRoles): RoleName {
  if (user.userRoles.length !== 1) {
    throw ApiError.internal('User does not have exactly one assigned role.');
  }
  return user.userRoles[0]!.role.name as RoleName;
}

function toAuthUser(user: UserWithRoles, role: RoleName): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role,
    avatarUrl: user.avatarUrl,
  };
}

async function issueTokenPair(userId: string, role: RoleName): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId, role });

  await authRepository.createRefreshToken(userId, hashRefreshToken(refreshToken), getTokenExpiry(refreshToken));

  return { accessToken, refreshToken };
}

export const authService = {
  async login(input: LoginInput): Promise<LoginResponseBody> {
    const user = await authRepository.findUserByEmail(input.email.trim().toLowerCase());

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const role = resolveSingleRole(user);
    const tokens = await issueTokenPair(user.id, role);
    await authRepository.updateLastLogin(user.id);

    return { user: toAuthUser(user, role), tokens };
  },

  async refresh(input: RefreshInput): Promise<RefreshResponseBody> {
    let payload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token.');
    }

    const tokenHash = hashRefreshToken(input.refreshToken);
    const stored = await authRepository.findActiveRefreshTokenByHash(tokenHash);
    if (!stored) {
      throw ApiError.unauthorized('Refresh token has been revoked or has expired.');
    }

    // Rotate: the presented token is single-use.
    await authRepository.revokeRefreshToken(stored.id);
    const tokens = await issueTokenPair(payload.sub, payload.role);

    return { tokens };
  },
};
