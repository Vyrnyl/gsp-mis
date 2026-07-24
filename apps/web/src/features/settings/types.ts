import type { AuthRoleId } from '@/features/auth/types';

export type ViewState = 'loading' | 'error' | 'ready';

export type SettingsTabId = 'system' | 'users' | 'audit' | 'backups';

/**
 * `GET`/`PUT /api/v1/settings` request and response shape — the API owns the mapping
 * to/from the string-keyed `system_settings` table (`settings.service.ts`), so the
 * client only ever sees this typed view (build-plan.md §3.4).
 */
export interface SystemSettingsFormValues {
  organizationName: string;
  membershipTermMonths: number;
  renewalWindowDays: number;
  emailNotificationsEnabled: boolean;
}

export interface PortalUserSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: AuthRoleId;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserFormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: AuthRoleId;
}

export interface CreateUserFormValues extends UserFormValues {
  password: string;
}

export type UserFilter = 'all' | AuthRoleId;

export interface AuditLogEntry {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface BackupInfo {
  lastRunAt: string | null;
  lastRunByName: string | null;
}
