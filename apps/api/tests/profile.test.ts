import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/shared/utils/audit-log', () => ({ writeAuditLog: vi.fn() }));

import { profileRepository, type UserWithRole } from '../src/modules/profile/profile.repository';
import { profileService } from '../src/modules/profile/profile.service';
import { writeAuditLog } from '../src/shared/utils/audit-log';
import { hashPassword, verifyPassword } from '../src/shared/utils/password';

const ADMIN_ROLE = { id: 'role-admin', name: 'admin', description: null };

function buildUser(overrides: Partial<UserWithRole> = {}): UserWithRole {
  return {
    id: 'user-1',
    fullName: 'Marisol Tabuena',
    email: 'admin@gsp-catanduanes.ph',
    passwordHash: 'hash',
    phoneNumber: '+63 917 100 0001',
    avatarUrl: null,
    isActive: true,
    lastLoginAt: new Date('2026-07-24T02:00:00Z'),
    createdAt: new Date('2026-07-22T09:00:00Z'),
    updatedAt: new Date('2026-07-22T09:00:00Z'),
    userRoles: [{ userId: 'user-1', roleId: ADMIN_ROLE.id, assignedAt: new Date('2026-07-22T09:00:00Z'), role: ADMIN_ROLE }],
    ...overrides,
  } as UserWithRole;
}

describe('profileService.getProfile', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('maps the signed-in user to a ProfileDto', async () => {
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(buildUser());

    const result = await profileService.getProfile('user-1');

    expect(result).toEqual({
      id: 'user-1',
      fullName: 'Marisol Tabuena',
      email: 'admin@gsp-catanduanes.ph',
      phoneNumber: '+63 917 100 0001',
      role: 'admin',
      createdAt: '2026-07-22T09:00:00.000Z',
      lastLoginAt: '2026-07-24T02:00:00.000Z',
    });
  });

  it('404s when the user no longer exists', async () => {
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(null);

    await expect(profileService.getProfile('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('profileService.updateProfile', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('saves the new fields, nulls a blank phone number, and writes an audit log entry', async () => {
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(buildUser());
    vi.spyOn(profileRepository, 'findByEmail').mockResolvedValue(null);
    const updateSpy = vi
      .spyOn(profileRepository, 'update')
      .mockResolvedValue(buildUser({ fullName: 'Marisol Bagadiong', phoneNumber: null }));

    const result = await profileService.updateProfile('user-1', {
      fullName: 'Marisol Bagadiong',
      email: 'admin@gsp-catanduanes.ph',
      phoneNumber: '',
    });

    expect(updateSpy).toHaveBeenCalledWith('user-1', {
      fullName: 'Marisol Bagadiong',
      email: 'admin@gsp-catanduanes.ph',
      phoneNumber: null,
    });
    expect(result.fullName).toBe('Marisol Bagadiong');
    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'profile.update',
      entityType: 'user',
      entityId: 'user-1',
    });
  });

  it('rejects an email already claimed by a different user', async () => {
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(buildUser());
    vi.spyOn(profileRepository, 'findByEmail').mockResolvedValue(buildUser({ id: 'user-2' }));

    await expect(
      profileService.updateProfile('user-1', {
        fullName: 'Marisol Tabuena',
        email: 'taken@gsp-catanduanes.ph',
        phoneNumber: '',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('allows saving with the same email the user already has', async () => {
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(buildUser());
    vi.spyOn(profileRepository, 'findByEmail').mockResolvedValue(buildUser());
    vi.spyOn(profileRepository, 'update').mockResolvedValue(buildUser());

    await expect(
      profileService.updateProfile('user-1', {
        fullName: 'Marisol Tabuena',
        email: 'admin@gsp-catanduanes.ph',
        phoneNumber: '',
      }),
    ).resolves.toMatchObject({ id: 'user-1' });
  });

  it('404s when the user no longer exists', async () => {
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(null);

    await expect(
      profileService.updateProfile('missing', { fullName: 'X', email: 'x@example.com', phoneNumber: '' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('profileService.changePassword', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('verifies the current password, hashes the new one, and writes an audit log entry', async () => {
    const currentHash = await hashPassword('OldPass123!');
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(buildUser({ passwordHash: currentHash }));
    const setHashSpy = vi.spyOn(profileRepository, 'setPasswordHash').mockResolvedValue(buildUser());

    await profileService.changePassword('user-1', { currentPassword: 'OldPass123!', newPassword: 'NewPass456!' });

    const [, passedHash] = setHashSpy.mock.calls[0]!;
    expect(await verifyPassword('NewPass456!', passedHash)).toBe(true);
    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'user.change_password',
      entityType: 'user',
      entityId: 'user-1',
    });
  });

  it('rejects an incorrect current password without touching the stored hash', async () => {
    const currentHash = await hashPassword('OldPass123!');
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(buildUser({ passwordHash: currentHash }));
    const setHashSpy = vi.spyOn(profileRepository, 'setPasswordHash').mockResolvedValue(buildUser());

    await expect(
      profileService.changePassword('user-1', { currentPassword: 'WrongPassword', newPassword: 'NewPass456!' }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(setHashSpy).not.toHaveBeenCalled();
  });

  it('404s when the user no longer exists', async () => {
    vi.spyOn(profileRepository, 'findById').mockResolvedValue(null);

    await expect(
      profileService.changePassword('missing', { currentPassword: 'x', newPassword: 'NewPass456!' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
