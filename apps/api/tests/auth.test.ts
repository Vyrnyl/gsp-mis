import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/shared/utils/audit-log', () => ({ writeAuditLog: vi.fn() }));

import { env } from '../src/config/env';
import { authRepository } from '../src/modules/auth/auth.repository';
import { authService } from '../src/modules/auth/auth.service';
import { writeAuditLog } from '../src/shared/utils/audit-log';
import { emailService } from '../src/shared/utils/email';
import { hashPassword } from '../src/shared/utils/password';

const ROLE_ADMIN = { id: 'role-admin', name: 'admin', description: null };
const ROLE_TROOP_LEADER = { id: 'role-troop-leader', name: 'troop_leader', description: null };
const ROLE_EXECUTIVE_COUNCIL = { id: 'role-executive-council', name: 'executive_council', description: null };

function buildUser(overrides: {
  id?: string;
  email?: string;
  passwordHash?: string;
  isActive?: boolean;
  role?: typeof ROLE_ADMIN;
}) {
  const role = overrides.role ?? ROLE_ADMIN;
  return {
    id: overrides.id ?? 'user-1',
    fullName: 'Maria Santos',
    email: overrides.email ?? 'maria@example.com',
    passwordHash: overrides.passwordHash ?? 'unused',
    phoneNumber: null,
    avatarUrl: null,
    isActive: overrides.isActive ?? true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    userRoles: [{ userId: overrides.id ?? 'user-1', roleId: role.id, assignedAt: new Date(), role }],
  };
}

describe('authService.login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({} as never);
    vi.spyOn(authRepository, 'updateLastLogin').mockResolvedValue({} as never);
  });

  it('returns a user and tokens for correct credentials', async () => {
    const passwordHash = await hashPassword('CorrectHorse1!');
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(buildUser({ passwordHash }));

    const result = await authService.login({ email: 'maria@example.com', password: 'CorrectHorse1!' });

    expect(result.user).toMatchObject({ email: 'maria@example.com', role: 'admin' });
    expect(result.tokens.accessToken).toEqual(expect.any(String));
    expect(result.tokens.refreshToken).toEqual(expect.any(String));
    expect(authRepository.updateLastLogin).toHaveBeenCalledWith('user-1');
  });

  it('rejects an unknown email', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

    await expect(authService.login({ email: 'nobody@example.com', password: 'whatever1' })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });
  });

  it('rejects a deactivated account', async () => {
    const passwordHash = await hashPassword('CorrectHorse1!');
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(buildUser({ passwordHash, isActive: false }));

    await expect(
      authService.login({ email: 'maria@example.com', password: 'CorrectHorse1!' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects the wrong password', async () => {
    const passwordHash = await hashPassword('CorrectHorse1!');
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(buildUser({ passwordHash }));

    await expect(
      authService.login({ email: 'maria@example.com', password: 'WrongPassword1!' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('authService.signup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({} as never);
  });

  const troopLeaderInput = {
    role: 'troop_leader' as const,
    firstName: 'Ana',
    lastName: 'Reyes',
    email: 'ana@example.com',
    password: 'StrongPass1!',
    troopNumber: 'T-2045',
    primaryScoutLevel: 'junior',
    homeCouncilName: 'Catanduanes Council',
  };

  it('creates a Troop Leader as inactive and pending, with no tokens issued', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'findRoleByName').mockResolvedValue(ROLE_TROOP_LEADER);
    const createSpy = vi
      .spyOn(authRepository, 'createUserWithRole')
      .mockResolvedValue(
        buildUser({ id: 'user-2', email: 'ana@example.com', role: ROLE_TROOP_LEADER, isActive: false }),
      );

    const result = await authService.signup(troopLeaderInput);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Ana Reyes', email: 'ana@example.com', isActive: false }),
      ROLE_TROOP_LEADER.id,
    );
    expect(result).toMatchObject({ status: 'pending' });
    expect(result).not.toHaveProperty('tokens');
    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'user-2',
      action: 'user.signup_pending',
      entityType: 'user',
      entityId: 'user-2',
    });
  });

  it('creates an Executive Council account as inactive and pending too', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'findRoleByName').mockResolvedValue(ROLE_EXECUTIVE_COUNCIL);
    const createSpy = vi
      .spyOn(authRepository, 'createUserWithRole')
      .mockResolvedValue(
        buildUser({ id: 'user-4', email: 'liza@example.com', role: ROLE_EXECUTIVE_COUNCIL, isActive: false }),
      );

    const result = await authService.signup({
      role: 'executive_council',
      firstName: 'Liza',
      lastName: 'Bagadiong',
      email: 'liza@example.com',
      password: 'StrongPass1!',
      councilName: 'Catanduanes Council',
      region: 'region-5',
      councilCode: 'CAT-001',
    });

    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }), ROLE_EXECUTIVE_COUNCIL.id);
    expect(result).toMatchObject({ status: 'pending' });
  });

  it('rejects login for a pending (not-yet-approved) account with the same generic message', async () => {
    const passwordHash = await hashPassword('StrongPass1!');
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(
      buildUser({ email: 'ana@example.com', passwordHash, isActive: false, role: ROLE_TROOP_LEADER }),
    );
    vi.spyOn(authRepository, 'updateLastLogin').mockResolvedValue({} as never);
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({} as never);

    await expect(
      authService.login({ email: 'ana@example.com', password: 'StrongPass1!' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a duplicate email', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(buildUser({ email: 'ana@example.com' }));

    await expect(authService.signup(troopLeaderInput)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects admin signup with the wrong secret key', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

    await expect(
      authService.signup({
        role: 'admin',
        firstName: 'Rey',
        lastName: 'Cruz',
        email: 'rey@example.com',
        password: 'StrongPass1!',
        employeeId: 'EMP-1',
        adminSecretKey: 'wrong-key',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('accepts admin signup with the correct secret key', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'findRoleByName').mockResolvedValue(ROLE_ADMIN);
    vi.spyOn(authRepository, 'createUserWithRole').mockResolvedValue(
      buildUser({ id: 'user-3', email: 'rey@example.com', role: ROLE_ADMIN }),
    );

    const result = await authService.signup({
      role: 'admin',
      firstName: 'Rey',
      lastName: 'Cruz',
      email: 'rey@example.com',
      password: 'StrongPass1!',
      employeeId: 'EMP-1',
      adminSecretKey: env.ADMIN_SIGNUP_KEY,
    });

    expect(result).toMatchObject({ status: 'active', user: { role: 'admin' } });
    if (result.status !== 'active') throw new Error('expected an active signup result');
    expect(result.tokens.accessToken).toEqual(expect.any(String));
    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'user-3',
      action: 'user.signup',
      entityType: 'user',
      entityId: 'user-3',
      details: { role: 'admin' },
    });
  });
});

describe('authService.logout', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('revokes an active refresh token and returns a generic message', async () => {
    vi.spyOn(authRepository, 'findActiveRefreshTokenByHash').mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: null,
      createdAt: new Date(),
    });
    const revokeSpy = vi.spyOn(authRepository, 'revokeRefreshToken').mockResolvedValue({} as never);

    const result = await authService.logout({ refreshToken: 'some-token' });

    expect(revokeSpy).toHaveBeenCalledWith('token-1');
    expect(result.message).toEqual(expect.any(String));
  });

  it('still succeeds when the token is unknown or already revoked', async () => {
    vi.spyOn(authRepository, 'findActiveRefreshTokenByHash').mockResolvedValue(null);
    const revokeSpy = vi.spyOn(authRepository, 'revokeRefreshToken');

    const result = await authService.logout({ refreshToken: 'garbage' });

    expect(revokeSpy).not.toHaveBeenCalled();
    expect(result.message).toEqual(expect.any(String));
  });
});

describe('authService.forgotPassword', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(undefined);
  });

  it('creates a reset token and emails it when the account exists and is active', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(buildUser({ email: 'maria@example.com' }));
    vi.spyOn(authRepository, 'invalidateActivePasswordResetTokens').mockResolvedValue({ count: 0 });
    const createSpy = vi.spyOn(authRepository, 'createPasswordResetToken').mockResolvedValue({} as never);

    const result = await authService.forgotPassword({ email: 'maria@example.com' });

    expect(createSpy).toHaveBeenCalledWith('user-1', expect.any(String), expect.any(Date));
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'maria@example.com',
      expect.stringContaining(`${env.WEB_APP_URL}/reset-password?token=`),
    );
    expect(result.message).toEqual(expect.any(String));
  });

  it('sends no email and returns the same generic message for an unknown address (no enumeration)', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    const createSpy = vi.spyOn(authRepository, 'createPasswordResetToken');

    const result = await authService.forgotPassword({ email: 'nobody@example.com' });

    expect(createSpy).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(result.message).toEqual(expect.any(String));
  });

  it('sends no email for a deactivated account, same generic message', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(buildUser({ isActive: false }));
    const createSpy = vi.spyOn(authRepository, 'createPasswordResetToken');

    const result = await authService.forgotPassword({ email: 'maria@example.com' });

    expect(createSpy).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(result.message).toEqual(expect.any(String));
  });

  it('still returns the generic message when email delivery fails', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(buildUser({ email: 'maria@example.com' }));
    vi.spyOn(authRepository, 'invalidateActivePasswordResetTokens').mockResolvedValue({ count: 0 });
    vi.spyOn(authRepository, 'createPasswordResetToken').mockResolvedValue({} as never);
    vi.spyOn(emailService, 'sendPasswordResetEmail').mockRejectedValue(new Error('SMTP down'));

    const result = await authService.forgotPassword({ email: 'maria@example.com' });

    expect(result.message).toEqual(expect.any(String));
  });
});

describe('authService.resetPassword', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('resets the password, consumes the token, and revokes every session for a valid token', async () => {
    vi.spyOn(authRepository, 'findActivePasswordResetTokenByHash').mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000),
      usedAt: null,
      createdAt: new Date(),
    });
    const updatePasswordSpy = vi.spyOn(authRepository, 'updateUserPassword').mockResolvedValue({} as never);
    const markUsedSpy = vi.spyOn(authRepository, 'markPasswordResetTokenUsed').mockResolvedValue({} as never);
    const revokeSpy = vi.spyOn(authRepository, 'revokeAllRefreshTokensForUser').mockResolvedValue({ count: 2 });

    const result = await authService.resetPassword({ token: 'raw-token', newPassword: 'BrandNewPass1!' });

    expect(updatePasswordSpy).toHaveBeenCalledWith('user-1', expect.any(String));
    expect(markUsedSpy).toHaveBeenCalledWith('reset-1');
    expect(revokeSpy).toHaveBeenCalledWith('user-1');
    expect(result.message).toEqual(expect.any(String));
  });

  it('rejects an unknown, already-used, or expired token', async () => {
    vi.spyOn(authRepository, 'findActivePasswordResetTokenByHash').mockResolvedValue(null);

    await expect(
      authService.resetPassword({ token: 'garbage', newPassword: 'BrandNewPass1!' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('authService.getCurrentUser', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('resolves the real signed-in user by id (backs GET /auth/me, feature 1.2)', async () => {
    vi.spyOn(authRepository, 'findUserById').mockResolvedValue(
      buildUser({ id: 'user-1', email: 'maria@example.com', role: ROLE_TROOP_LEADER }),
    );

    const result = await authService.getCurrentUser('user-1');

    expect(result.user).toMatchObject({ id: 'user-1', email: 'maria@example.com', role: 'troop_leader' });
  });

  it('rejects when the user no longer exists (deleted after the token was issued)', async () => {
    vi.spyOn(authRepository, 'findUserById').mockResolvedValue(null);

    await expect(authService.getCurrentUser('gone')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a deactivated account even with a still-valid access token', async () => {
    vi.spyOn(authRepository, 'findUserById').mockResolvedValue(buildUser({ isActive: false }));

    await expect(authService.getCurrentUser('user-1')).rejects.toMatchObject({ statusCode: 401 });
  });
});
