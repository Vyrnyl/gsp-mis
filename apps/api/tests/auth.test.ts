import { beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '../src/config/env';
import { authRepository } from '../src/modules/auth/auth.repository';
import { authService } from '../src/modules/auth/auth.service';
import { hashPassword } from '../src/shared/utils/password';

const ROLE_ADMIN = { id: 'role-admin', name: 'admin', description: null };
const ROLE_TROOP_LEADER = { id: 'role-troop-leader', name: 'troop_leader', description: null };

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

  it('creates a user with exactly one role and returns tokens', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'findRoleByName').mockResolvedValue(ROLE_TROOP_LEADER);
    const createSpy = vi
      .spyOn(authRepository, 'createUserWithRole')
      .mockResolvedValue(buildUser({ id: 'user-2', email: 'ana@example.com', role: ROLE_TROOP_LEADER }));

    const result = await authService.signup(troopLeaderInput);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Ana Reyes', email: 'ana@example.com' }),
      ROLE_TROOP_LEADER.id,
    );
    expect(result.user).toMatchObject({ email: 'ana@example.com', role: 'troop_leader' });
    expect(result.tokens.accessToken).toEqual(expect.any(String));
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

    expect(result.user.role).toBe('admin');
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
  it('returns the same generic message regardless of input', async () => {
    const result = await authService.forgotPassword({ email: 'anyone@example.com' });
    expect(result.message).toEqual(expect.any(String));
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
