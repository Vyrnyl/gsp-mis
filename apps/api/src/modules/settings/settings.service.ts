import { randomBytes } from 'node:crypto';

import type { SystemSetting } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/api-response';
import { writeAuditLog } from '../../shared/utils/audit-log';
import { hashPassword } from '../../shared/utils/password';
import type { AuditLogWithUser, UserWithRole } from './settings.repository';
import { settingsRepository } from './settings.repository';
import type {
  CreateUserInput,
  ListAuditLogsQuery,
  ListUsersQuery,
  SetUserStatusInput,
  UpdateSystemSettingsInput,
  UpdateUserInput,
} from './settings.schema';
import type { AuditLogDto, BackupInfoDto, PortalUserDto, SystemSettingsDto } from './settings.types';

const SETTINGS_DEFAULTS: SystemSettingsDto = {
  organizationName: 'Girl Scouts of the Philippines',
  membershipTermMonths: 12,
  renewalWindowDays: 30,
  emailNotificationsEnabled: true,
};

function settingsRowsToDto(rows: SystemSetting[]): SystemSettingsDto {
  const byKey = new Map(rows.map((row) => [row.settingKey, row.settingValue]));
  return {
    organizationName: byKey.get('organization.name') ?? SETTINGS_DEFAULTS.organizationName,
    membershipTermMonths: Number(byKey.get('membership.term_months') ?? SETTINGS_DEFAULTS.membershipTermMonths),
    renewalWindowDays: Number(byKey.get('membership.renewal_window_days') ?? SETTINGS_DEFAULTS.renewalWindowDays),
    emailNotificationsEnabled: (byKey.get('notifications.email_enabled') ?? 'true') === 'true',
  };
}

function settingsDtoToRows(input: UpdateSystemSettingsInput): Array<{ key: string; value: string }> {
  return [
    { key: 'organization.name', value: input.organizationName },
    { key: 'membership.term_months', value: String(input.membershipTermMonths) },
    { key: 'membership.renewal_window_days', value: String(input.renewalWindowDays) },
    { key: 'notifications.email_enabled', value: String(input.emailNotificationsEnabled) },
  ];
}

function toPortalUserDto(user: UserWithRole): PortalUserDto {
  const role = user.userRoles[0]?.role.name;
  if (!role) throw ApiError.internal(`User ${user.id} has no role assigned.`);

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: role as PortalUserDto['role'],
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}

function toAuditLogDto(entry: AuditLogWithUser): AuditLogDto {
  return {
    id: entry.id,
    actorName: entry.user?.fullName ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    details: (entry.details as Record<string, unknown> | null) ?? null,
    createdAt: entry.createdAt.toISOString(),
  };
}

/** Base64url is safe to display/copy and always satisfies the 8-char minimum by a wide margin. */
function generateTemporaryPassword(): string {
  return `Gsp-${randomBytes(6).toString('hex')}!`;
}

async function requireUser(id: string): Promise<UserWithRole> {
  const user = await settingsRepository.findUserById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return user;
}

/** Blocks the action that would leave the portal with zero administrators. */
async function assertNotLastAdmin(user: UserWithRole): Promise<void> {
  if (user.userRoles[0]?.role.name !== 'admin') return;
  const remaining = await settingsRepository.countUsersByRole('admin', user.id);
  if (remaining === 0) throw ApiError.conflict('At least one administrator must remain — assign another admin first.');
}

export const settingsService = {
  async getSystemSettings(): Promise<SystemSettingsDto> {
    const rows = await settingsRepository.findAllSettings();
    return settingsRowsToDto(rows);
  },

  async updateSystemSettings(input: UpdateSystemSettingsInput, actorId: string): Promise<SystemSettingsDto> {
    await settingsRepository.upsertSettings(settingsDtoToRows(input));
    // `entityType` is deliberately `settings`, not `system` — `system` is reserved for
    // `backup.run` alone so the Backups tab's history list (a plain entityType filter,
    // no separate action filter) never picks up an unrelated settings save.
    await writeAuditLog({ userId: actorId, action: 'settings.update', entityType: 'settings' });
    return input;
  },

  async getBackupInfo(): Promise<BackupInfoDto> {
    const latest = await settingsRepository.findLatestBackupLog();
    return {
      lastRunAt: latest ? latest.createdAt.toISOString() : null,
      lastRunByName: latest?.user?.fullName ?? null,
    };
  },

  /**
   * There is no real database-dump job in this codebase — this writes a real,
   * auditable `audit_logs` row so the workflow is testable end to end, the same
   * honest simplification as 1.1's non-delivering forgot-password (build-plan.md §7).
   */
  async runBackup(actorId: string): Promise<BackupInfoDto> {
    await writeAuditLog({ userId: actorId, action: 'backup.run', entityType: 'system' });
    return settingsService.getBackupInfo();
  },

  async listUsers(query: ListUsersQuery): Promise<{ users: PortalUserDto[]; meta: PaginationMeta }> {
    const { rows, total } = await settingsRepository.listUsers(query);
    return { users: rows.map(toPortalUserDto), meta: buildPaginationMeta(query.page, query.pageSize, total) };
  },

  async createUser(input: CreateUserInput, actorId: string): Promise<PortalUserDto> {
    const existing = await settingsRepository.findUserByEmail(input.email);
    if (existing) throw ApiError.conflict('A user with this email already exists.');

    const role = await settingsRepository.findRoleByName(input.role);
    if (!role) throw ApiError.internal(`Role "${input.role}" is not seeded.`);

    const passwordHash = await hashPassword(input.password);
    const created = await settingsRepository.createUserWithRole(
      { fullName: input.fullName, email: input.email, phoneNumber: input.phoneNumber?.trim() || null, passwordHash },
      role.id,
    );
    await writeAuditLog({ userId: actorId, action: 'user.create', entityType: 'user', entityId: created.id });
    return toPortalUserDto(created);
  },

  async updateUser(id: string, input: UpdateUserInput, actorId: string): Promise<PortalUserDto> {
    const user = await requireUser(id);

    const existing = await settingsRepository.findUserByEmail(input.email);
    if (existing && existing.id !== id) throw ApiError.conflict('A user with this email already exists.');

    if (user.userRoles[0]?.role.name === 'admin' && input.role !== 'admin') {
      await assertNotLastAdmin(user);
    }

    const role = await settingsRepository.findRoleByName(input.role);
    if (!role) throw ApiError.internal(`Role "${input.role}" is not seeded.`);

    const updated = await settingsRepository.updateUserAndRole(
      id,
      { fullName: input.fullName, email: input.email, phoneNumber: input.phoneNumber?.trim() || null },
      role.id,
    );
    await writeAuditLog({ userId: actorId, action: 'user.update', entityType: 'user', entityId: id, details: { role: input.role } });
    return toPortalUserDto(updated);
  },

  async setUserStatus(id: string, input: SetUserStatusInput, actorId: string): Promise<PortalUserDto> {
    if (id === actorId) throw ApiError.badRequest('You cannot deactivate your own account.');
    const user = await requireUser(id);
    if (input.isActive === user.isActive) return toPortalUserDto(user);

    if (!input.isActive) await assertNotLastAdmin(user);

    const updated = await settingsRepository.setUserActive(id, input.isActive);
    await writeAuditLog({
      userId: actorId,
      action: input.isActive ? 'user.activate' : 'user.deactivate',
      entityType: 'user',
      entityId: id,
    });
    return toPortalUserDto(updated);
  },

  async resetPassword(id: string, actorId: string): Promise<string> {
    await requireUser(id);
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    await settingsRepository.setPasswordHash(id, passwordHash);
    await writeAuditLog({ userId: actorId, action: 'user.reset_password', entityType: 'user', entityId: id });
    return temporaryPassword;
  },

  async deleteUser(id: string, actorId: string): Promise<void> {
    if (id === actorId) throw ApiError.badRequest('You cannot delete your own account.');
    const user = await requireUser(id);
    await assertNotLastAdmin(user);

    const ledTroops = await settingsRepository.countLedTroops(id);
    if (ledTroops > 0) {
      throw ApiError.conflict('This user still leads one or more troops — reassign those troops first.');
    }

    await settingsRepository.deleteUser(id);
    await writeAuditLog({ userId: actorId, action: 'user.delete', entityType: 'user', entityId: id });
  },

  async listAuditLogs(query: ListAuditLogsQuery): Promise<{ entries: AuditLogDto[]; meta: PaginationMeta }> {
    const { rows, total } = await settingsRepository.listAuditLogs(query);
    return { entries: rows.map(toAuditLogDto), meta: buildPaginationMeta(query.page, query.pageSize, total) };
  },
};
