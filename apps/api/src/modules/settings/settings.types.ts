import type { RoleName } from '../../shared/constants/roles';
import type {
  CreateUserInput,
  ListAuditLogsQuery,
  ListUsersQuery,
  UpdateSystemSettingsInput,
  UpdateUserInput,
} from './settings.schema';

export type CreateUserRequestBody = CreateUserInput;
export type UpdateUserRequestBody = UpdateUserInput;
export type UpdateSystemSettingsRequestBody = UpdateSystemSettingsInput;
export type { ListAuditLogsQuery, ListUsersQuery };

/** `GET`/`PUT /settings` — the typed view over the string-valued `system_settings` rows. */
export interface SystemSettingsDto {
  organizationName: string;
  membershipTermMonths: number;
  renewalWindowDays: number;
  emailNotificationsEnabled: boolean;
}

/** `GET /settings/backup` and `POST /settings/backup` — derived from the audit log, not a stored row. */
export interface BackupInfoDto {
  lastRunAt: string | null;
  lastRunByName: string | null;
}

export interface PortalUserDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: RoleName;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ResetPasswordResponseBody {
  temporaryPassword: string;
}

export interface AuditLogDto {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}
