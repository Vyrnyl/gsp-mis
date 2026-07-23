import { createHash } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/api-error';
import { getTokenExpiry, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import type { RoleName } from '../../shared/constants/roles';
import { authRepository } from './auth.repository';
import type { ForgotPasswordInput, LoginInput, LogoutInput, RefreshInput, SignupInput } from './auth.schema';
import type {
  AuthTokens,
  AuthUser,
  ForgotPasswordResponseBody,
  LoginResponseBody,
  LogoutResponseBody,
  RefreshResponseBody,
  SignupResponseBody,
} from './auth.types';

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

  /**
   * Creates the login account (`users` + one `user_roles` row) only. The role-specific
   * affiliation fields (troop number, home council, council code, employee ID, ...) are
   * validated by `signupSchema` but have nowhere relational to live yet — linking a
   * troop leader to a real `Troop` or an executive to a `Council` is an admin action in
   * feature 1.6 (Organization Management), not something self-signup can assert.
   */
  async signup(input: SignupInput): Promise<SignupResponseBody> {
    const email = input.email.trim().toLowerCase();

    const existing = await authRepository.findUserByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists.');
    }

    if (input.role === 'admin' && input.adminSecretKey !== env.ADMIN_SIGNUP_KEY) {
      throw ApiError.forbidden('Invalid admin secret key.');
    }

    const role = await authRepository.findRoleByName(input.role);
    if (!role) {
      throw ApiError.internal(`Role "${input.role}" is not seeded.`);
    }

    const passwordHash = await hashPassword(input.password);
    const created = await authRepository.createUserWithRole(
      { fullName: `${input.firstName.trim()} ${input.lastName.trim()}`, email, passwordHash },
      role.id,
    );

    const resolvedRole = resolveSingleRole(created);
    const tokens = await issueTokenPair(created.id, resolvedRole);

    return { user: toAuthUser(created, resolvedRole), tokens };
  },

  /** Best-effort revoke — logout must succeed even if the token is already gone, so the client can always clear its cookies. */
  async logout(input: LogoutInput): Promise<LogoutResponseBody> {
    const stored = await authRepository.findActiveRefreshTokenByHash(hashRefreshToken(input.refreshToken));
    if (stored) {
      await authRepository.revokeRefreshToken(stored.id);
    }

    return { message: 'Signed out.' };
  },

  /** Deliberately identical response whether or not the email exists — no user enumeration. */
  async forgotPassword(_input: ForgotPasswordInput): Promise<ForgotPasswordResponseBody> {
    return { message: 'If that email is registered, a password reset link has been sent.' };
  },
};
