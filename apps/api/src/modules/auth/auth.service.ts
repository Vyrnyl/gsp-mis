import { createHash, randomBytes } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { env } from '../../config/env';
import { emailService } from '../../shared/utils/email';
import { ApiError } from '../../shared/utils/api-error';
import { writeAuditLog } from '../../shared/utils/audit-log';
import { getTokenExpiry, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import type { RoleName } from '../../shared/constants/roles';
import { authRepository } from './auth.repository';
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  ResetPasswordInput,
  SignupInput,
} from './auth.schema';
import type {
  AuthTokens,
  AuthUser,
  ForgotPasswordResponseBody,
  LoginResponseBody,
  LogoutResponseBody,
  MeResponseBody,
  RefreshResponseBody,
  ResetPasswordResponseBody,
  SignupResponseBody,
} from './auth.types';

/** 1 hour — short enough that a stale, unread email carries little risk. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

type UserWithRoles = Prisma.UserGetPayload<{ include: { userRoles: { include: { role: true } } } }>;

/** Refresh tokens are high-entropy JWTs, not human passwords — a fast hash is correct here, bcrypt is not. */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Same reasoning as `hashRefreshToken` — a high-entropy random token, not a human password. */
function hashResetToken(token: string): string {
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
   *
   * Security gate: Executive Council and Troop Leader are otherwise fully open
   * self-signup with no verification of the affiliation they typed in, which would
   * let anyone grant themselves live approval/finance/reporting access. They land
   * `isActive: false` and get no session; an Administrator must activate them from
   * Settings > Users & Access (3.4's existing activate/deactivate action) before they
   * can log in. Admin signup keeps its original behavior — the shared
   * `ADMIN_SIGNUP_KEY` is its gate instead of a queue.
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

    const requiresApproval = input.role === 'executive_council' || input.role === 'troop_leader';

    const passwordHash = await hashPassword(input.password);
    const created = await authRepository.createUserWithRole(
      {
        fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        email,
        passwordHash,
        isActive: !requiresApproval,
      },
      role.id,
    );

    if (requiresApproval) {
      await writeAuditLog({
        userId: created.id,
        action: 'user.signup_pending',
        entityType: 'user',
        entityId: created.id,
      });
      return {
        status: 'pending',
        message: 'Account created. An administrator must approve your account before you can sign in.',
      };
    }

    const resolvedRole = resolveSingleRole(created);
    const tokens = await issueTokenPair(created.id, resolvedRole);

    return { status: 'active', user: toAuthUser(created, resolvedRole), tokens };
  },

  /** Best-effort revoke — logout must succeed even if the token is already gone, so the client can always clear its cookies. */
  async logout(input: LogoutInput): Promise<LogoutResponseBody> {
    const stored = await authRepository.findActiveRefreshTokenByHash(hashRefreshToken(input.refreshToken));
    if (stored) {
      await authRepository.revokeRefreshToken(stored.id);
    }

    return { message: 'Signed out.' };
  },

  /**
   * Deliberately identical response whether or not the email exists — no user
   * enumeration. Email delivery (build-plan.md §7, open decision #7) is genuinely
   * best-effort here for the same reason: surfacing a send failure to the caller
   * would leak that the address exists (or doesn't), so failures are only logged.
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponseBody> {
    const email = input.email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(email);

    if (user && user.isActive) {
      await authRepository.invalidateActivePasswordResetTokens(user.id);

      const rawToken = randomBytes(32).toString('hex');
      await authRepository.createPasswordResetToken(
        user.id,
        hashResetToken(rawToken),
        new Date(Date.now() + RESET_TOKEN_TTL_MS),
      );

      const resetUrl = `${env.WEB_APP_URL}/reset-password?token=${rawToken}`;
      try {
        await emailService.sendPasswordResetEmail(user.email, resetUrl);
      } catch (error) {
        console.error('[auth] failed to send password reset email', error);
      }
    }

    return { message: 'If that email is registered, a password reset link has been sent.' };
  },

  /** Public by design (auth.routes.ts) — the token itself, not a session, proves the caller owns the account. */
  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResponseBody> {
    const record = await authRepository.findActivePasswordResetTokenByHash(hashResetToken(input.token));
    if (!record) {
      throw ApiError.badRequest('This reset link is invalid or has expired.');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await authRepository.updateUserPassword(record.userId, passwordHash);
    await authRepository.markPasswordResetTokenUsed(record.id);
    await authRepository.revokeAllRefreshTokensForUser(record.userId);

    return { message: 'Your password has been reset. Please sign in with your new password.' };
  },

  /** Backs `GET /auth/me` — `requireAuth` guarantees `userId` came from a valid access token. */
  async getCurrentUser(userId: string): Promise<MeResponseBody> {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Session is no longer valid.');
    }

    const role = resolveSingleRole(user);
    return { user: toAuthUser(user, role) };
  },
};
