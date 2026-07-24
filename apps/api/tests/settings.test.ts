import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/shared/utils/audit-log', () => ({ writeAuditLog: vi.fn() }));

import { settingsRepository, type AuditLogWithUser, type UserWithRole } from '../src/modules/settings/settings.repository';
import { settingsService } from '../src/modules/settings/settings.service';
import { writeAuditLog } from '../src/shared/utils/audit-log';
import { verifyPassword } from '../src/shared/utils/password';
import type {
  CreateUserInput,
  ListAuditLogsQuery,
  ListUsersQuery,
  UpdateUserInput,
} from '../src/modules/settings/settings.schema';

const ADMIN_ROLE = { id: 'role-admin', name: 'admin', description: null };
const TROOP_LEADER_ROLE = { id: 'role-troop-leader', name: 'troop_leader', description: null };

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

function buildAuditLog(overrides: Partial<AuditLogWithUser> = {}): AuditLogWithUser {
  return {
    id: 'log-1',
    userId: 'user-1',
    action: 'user.create',
    entityType: 'user',
    entityId: 'user-2',
    details: null,
    createdAt: new Date('2026-07-24T09:00:00Z'),
    user: buildUser(),
    ...overrides,
  } as AuditLogWithUser;
}

describe('settingsService system settings', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('falls back to defaults for any setting key not yet in the table', async () => {
    vi.spyOn(settingsRepository, 'findAllSettings').mockResolvedValue([]);

    const result = await settingsService.getSystemSettings();

    expect(result).toEqual({
      organizationName: 'Girl Scouts of the Philippines',
      membershipTermMonths: 12,
      renewalWindowDays: 30,
      emailNotificationsEnabled: true,
    });
  });

  it('maps the real seeded rows over the defaults', async () => {
    vi.spyOn(settingsRepository, 'findAllSettings').mockResolvedValue([
      { id: 's1', settingKey: 'organization.name', settingValue: 'GSP — Catanduanes Council', description: null, updatedAt: new Date() },
      { id: 's2', settingKey: 'notifications.email_enabled', settingValue: 'false', description: null, updatedAt: new Date() },
    ]);

    const result = await settingsService.getSystemSettings();

    expect(result.organizationName).toBe('GSP — Catanduanes Council');
    expect(result.emailNotificationsEnabled).toBe(false);
    expect(result.membershipTermMonths).toBe(12);
  });

  it('upserts every key and writes an audit log entry on save', async () => {
    const upsertSpy = vi.spyOn(settingsRepository, 'upsertSettings').mockResolvedValue(undefined);

    await settingsService.updateSystemSettings(
      { organizationName: 'New Name', membershipTermMonths: 6, renewalWindowDays: 14, emailNotificationsEnabled: false },
      'user-1',
    );

    expect(upsertSpy).toHaveBeenCalledWith([
      { key: 'organization.name', value: 'New Name' },
      { key: 'membership.term_months', value: '6' },
      { key: 'membership.renewal_window_days', value: '14' },
      { key: 'notifications.email_enabled', value: 'false' },
    ]);
    expect(writeAuditLog).toHaveBeenCalledWith({ userId: 'user-1', action: 'settings.update', entityType: 'settings' });
  });
});

describe('settingsService backups', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('reports no backup yet when the audit log has no backup.run entry', async () => {
    vi.spyOn(settingsRepository, 'findLatestBackupLog').mockResolvedValue(null);

    const result = await settingsService.getBackupInfo();

    expect(result).toEqual({ lastRunAt: null, lastRunByName: null });
  });

  it('derives last-backup info from the most recent backup.run audit entry', async () => {
    vi.spyOn(settingsRepository, 'findLatestBackupLog').mockResolvedValue(
      buildAuditLog({ action: 'backup.run', entityType: 'system', entityId: null, user: buildUser({ fullName: 'Marisol Tabuena' }) }),
    );

    const result = await settingsService.getBackupInfo();

    expect(result).toEqual({ lastRunAt: '2026-07-24T09:00:00.000Z', lastRunByName: 'Marisol Tabuena' });
  });

  it('writes a real audit log entry when a backup is triggered — no actual dump job runs', async () => {
    vi.spyOn(settingsRepository, 'findLatestBackupLog').mockResolvedValue(
      buildAuditLog({ action: 'backup.run', entityType: 'system', entityId: null }),
    );

    await settingsService.runBackup('user-1');

    expect(writeAuditLog).toHaveBeenCalledWith({ userId: 'user-1', action: 'backup.run', entityType: 'system' });
  });
});

describe('settingsService users', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists users mapped to the portal DTO with pagination meta', async () => {
    vi.spyOn(settingsRepository, 'listUsers').mockResolvedValue({ rows: [buildUser()], total: 1 });

    const query: ListUsersQuery = { page: 1, pageSize: 20 };
    const result = await settingsService.listUsers(query);

    expect(result.users).toEqual([
      {
        id: 'user-1',
        fullName: 'Marisol Tabuena',
        email: 'admin@gsp-catanduanes.ph',
        phoneNumber: '+63 917 100 0001',
        role: 'admin',
        isActive: true,
        lastLoginAt: '2026-07-24T02:00:00.000Z',
        createdAt: '2026-07-22T09:00:00.000Z',
      },
    ]);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });

  it('rejects creating a user with an email already in use', async () => {
    vi.spyOn(settingsRepository, 'findUserByEmail').mockResolvedValue(buildUser());

    const input: CreateUserInput = {
      fullName: 'New Leader',
      email: 'admin@gsp-catanduanes.ph',
      role: 'troop_leader',
      password: 'Password123!',
    };
    await expect(settingsService.createUser(input, 'user-1')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates a user, hashes the password, and writes an audit log entry', async () => {
    vi.spyOn(settingsRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(settingsRepository, 'findRoleByName').mockResolvedValue(TROOP_LEADER_ROLE);
    const createSpy = vi
      .spyOn(settingsRepository, 'createUserWithRole')
      .mockResolvedValue(buildUser({ id: 'user-2', fullName: 'New Leader', userRoles: [{ userId: 'user-2', roleId: TROOP_LEADER_ROLE.id, assignedAt: new Date(), role: TROOP_LEADER_ROLE }] }));

    const input: CreateUserInput = {
      fullName: 'New Leader',
      email: 'new.leader@gsp-catanduanes.ph',
      role: 'troop_leader',
      password: 'Password123!',
    };
    const result = await settingsService.createUser(input, 'user-1');

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'New Leader', email: 'new.leader@gsp-catanduanes.ph', phoneNumber: null }),
      TROOP_LEADER_ROLE.id,
    );
    const passedHash = createSpy.mock.calls[0]![0].passwordHash;
    expect(await verifyPassword('Password123!', passedHash)).toBe(true);
    expect(result.role).toBe('troop_leader');
    expect(writeAuditLog).toHaveBeenCalledWith({ userId: 'user-1', action: 'user.create', entityType: 'user', entityId: 'user-2' });
  });

  it('blocks demoting the last administrator away from admin', async () => {
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(buildUser());
    vi.spyOn(settingsRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(settingsRepository, 'countUsersByRole').mockResolvedValue(0);

    const input: UpdateUserInput = {
      fullName: 'Marisol Tabuena',
      email: 'admin@gsp-catanduanes.ph',
      role: 'troop_leader',
    };
    await expect(settingsService.updateUser('user-1', input, 'user-1')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('allows demoting an admin when another administrator remains', async () => {
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(buildUser());
    vi.spyOn(settingsRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(settingsRepository, 'countUsersByRole').mockResolvedValue(1);
    vi.spyOn(settingsRepository, 'findRoleByName').mockResolvedValue(TROOP_LEADER_ROLE);
    vi.spyOn(settingsRepository, 'updateUserAndRole').mockResolvedValue(
      buildUser({ userRoles: [{ userId: 'user-1', roleId: TROOP_LEADER_ROLE.id, assignedAt: new Date(), role: TROOP_LEADER_ROLE }] }),
    );

    const input: UpdateUserInput = { fullName: 'Marisol Tabuena', email: 'admin@gsp-catanduanes.ph', role: 'troop_leader' };
    const result = await settingsService.updateUser('user-1', input, 'user-99');

    expect(result.role).toBe('troop_leader');
    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'user-99',
      action: 'user.update',
      entityType: 'user',
      entityId: 'user-1',
      details: { role: 'troop_leader' },
    });
  });

  it('rejects a user editing their own account into an email already used elsewhere', async () => {
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(buildUser());
    vi.spyOn(settingsRepository, 'findUserByEmail').mockResolvedValue(buildUser({ id: 'user-2' }));

    const input: UpdateUserInput = { fullName: 'Marisol Tabuena', email: 'taken@gsp-catanduanes.ph', role: 'admin' };
    await expect(settingsService.updateUser('user-1', input, 'user-1')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('blocks a user from deactivating their own account', async () => {
    await expect(settingsService.setUserStatus('user-1', { isActive: false }, 'user-1')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('blocks deactivating the last remaining administrator', async () => {
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(buildUser());
    vi.spyOn(settingsRepository, 'countUsersByRole').mockResolvedValue(0);

    await expect(settingsService.setUserStatus('user-1', { isActive: false }, 'user-99')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deactivates a non-admin user and writes an audit log entry', async () => {
    const troopLeader = buildUser({
      id: 'user-3',
      fullName: 'Liza Bagadiong',
      userRoles: [{ userId: 'user-3', roleId: TROOP_LEADER_ROLE.id, assignedAt: new Date(), role: TROOP_LEADER_ROLE }],
    });
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(troopLeader);
    const setActiveSpy = vi.spyOn(settingsRepository, 'setUserActive').mockResolvedValue({ ...troopLeader, isActive: false });

    const result = await settingsService.setUserStatus('user-3', { isActive: false }, 'user-1');

    expect(setActiveSpy).toHaveBeenCalledWith('user-3', false);
    expect(result.isActive).toBe(false);
    expect(writeAuditLog).toHaveBeenCalledWith({ userId: 'user-1', action: 'user.deactivate', entityType: 'user', entityId: 'user-3' });
  });

  it('generates and hashes a fresh temporary password on reset', async () => {
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(buildUser());
    const setHashSpy = vi.spyOn(settingsRepository, 'setPasswordHash').mockResolvedValue(buildUser());

    const temporaryPassword = await settingsService.resetPassword('user-1', 'user-99');

    expect(temporaryPassword.length).toBeGreaterThanOrEqual(8);
    const [, passedHash] = setHashSpy.mock.calls[0]!;
    expect(await verifyPassword(temporaryPassword, passedHash)).toBe(true);
    expect(writeAuditLog).toHaveBeenCalledWith({ userId: 'user-99', action: 'user.reset_password', entityType: 'user', entityId: 'user-1' });
  });

  it('blocks a user from deleting their own account', async () => {
    await expect(settingsService.deleteUser('user-1', 'user-1')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('blocks deleting the last remaining administrator', async () => {
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(buildUser());
    vi.spyOn(settingsRepository, 'countUsersByRole').mockResolvedValue(0);

    await expect(settingsService.deleteUser('user-1', 'user-99')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('blocks deleting a user who still leads a troop', async () => {
    const troopLeader = buildUser({
      id: 'user-3',
      userRoles: [{ userId: 'user-3', roleId: TROOP_LEADER_ROLE.id, assignedAt: new Date(), role: TROOP_LEADER_ROLE }],
    });
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(troopLeader);
    vi.spyOn(settingsRepository, 'countLedTroops').mockResolvedValue(1);

    await expect(settingsService.deleteUser('user-3', 'user-1')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes a user with no led troops and writes an audit log entry', async () => {
    const troopLeader = buildUser({
      id: 'user-3',
      userRoles: [{ userId: 'user-3', roleId: TROOP_LEADER_ROLE.id, assignedAt: new Date(), role: TROOP_LEADER_ROLE }],
    });
    vi.spyOn(settingsRepository, 'findUserById').mockResolvedValue(troopLeader);
    vi.spyOn(settingsRepository, 'countLedTroops').mockResolvedValue(0);
    const deleteSpy = vi.spyOn(settingsRepository, 'deleteUser').mockResolvedValue(troopLeader);

    await settingsService.deleteUser('user-3', 'user-1');

    expect(deleteSpy).toHaveBeenCalledWith('user-3');
    expect(writeAuditLog).toHaveBeenCalledWith({ userId: 'user-1', action: 'user.delete', entityType: 'user', entityId: 'user-3' });
  });
});

describe('settingsService audit log', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lists audit log entries mapped to the DTO with pagination meta', async () => {
    vi.spyOn(settingsRepository, 'listAuditLogs').mockResolvedValue({ rows: [buildAuditLog()], total: 1 });

    const query: ListAuditLogsQuery = { page: 1, pageSize: 20 };
    const result = await settingsService.listAuditLogs(query);

    expect(result.entries).toEqual([
      {
        id: 'log-1',
        actorName: 'Marisol Tabuena',
        action: 'user.create',
        entityType: 'user',
        entityId: 'user-2',
        details: null,
        createdAt: '2026-07-24T09:00:00.000Z',
      },
    ]);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });

  it('maps a system-actor entry (no user row) to a null actor name', async () => {
    vi.spyOn(settingsRepository, 'listAuditLogs').mockResolvedValue({
      rows: [buildAuditLog({ userId: undefined, user: null, action: 'backup.run', entityType: 'system', entityId: null })],
      total: 1,
    });

    const result = await settingsService.listAuditLogs({ page: 1, pageSize: 20 });

    expect(result.entries[0]!.actorName).toBeNull();
  });
});
