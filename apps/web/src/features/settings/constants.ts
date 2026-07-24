import type { AuthRoleId } from '@/features/auth/types';
import {
  ActivityIcon,
  AdminIcon,
  BackupIcon,
  CouncilIcon,
  MembersIcon,
  SettingsIcon,
  TroopLeaderIcon,
  type IconType,
} from '@/shared/components/icons';
import type { BadgeTone, TabItem } from '@/shared/components/ui';

import type { CreateUserFormValues, SystemSettingsFormValues, UserFormValues } from './types';

export const SETTINGS_TABS: TabItem[] = [
  { id: 'system', label: 'System Settings', icon: SettingsIcon },
  { id: 'users', label: 'Users & Access', icon: MembersIcon },
  { id: 'audit', label: 'Audit Log', icon: ActivityIcon },
  { id: 'backups', label: 'Backups', icon: BackupIcon },
];

/**
 * First badge-tone mapping for roles in the app — the prototype colored role badges
 * red/blue/green (Gsp.html `renderUsers`); kept here rather than in `shared/constants`
 * since this is the first screen to render every user's role as a status pill.
 */
export const ROLE_BADGE_TONES: Record<AuthRoleId, BadgeTone> = {
  admin: 'red',
  executive_council: 'blue',
  troop_leader: 'green',
};

export const ROLE_ICONS: Record<AuthRoleId, IconType> = {
  admin: AdminIcon,
  executive_council: CouncilIcon,
  troop_leader: TroopLeaderIcon,
};

export const USER_ROLE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Administrator' },
  { value: 'executive_council', label: 'Executive Council' },
  { value: 'troop_leader', label: 'Troop Leader' },
];

export const ROLE_ASSIGN_OPTIONS: Array<{ value: AuthRoleId; label: string }> = [
  { value: 'admin', label: 'Administrator' },
  { value: 'executive_council', label: 'Executive Council' },
  { value: 'troop_leader', label: 'Troop Leader' },
];

export const EMPTY_USER_FORM_VALUES: UserFormValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  role: 'troop_leader',
};

export const EMPTY_CREATE_USER_FORM_VALUES: CreateUserFormValues = {
  ...EMPTY_USER_FORM_VALUES,
  password: '',
};

export const EMPTY_SYSTEM_SETTINGS_FORM_VALUES: SystemSettingsFormValues = {
  organizationName: '',
  membershipTermMonths: 12,
  renewalWindowDays: 30,
  emailNotificationsEnabled: true,
};

/**
 * `AuditLogEntry.action` is `<entityType>.<verb>` (e.g. `user.reset_password`,
 * `backup.run`) — the API's own convention (`members.service.ts`'s `member.approve`
 * etc). Tone keys off the verb after the last dot, same coloring idiom as the
 * prototype's Activity Log.
 */
export function auditActionTone(action: string): 'green' | 'blue' | 'red' | 'gold' {
  const verb = action.split('.').pop() ?? action;
  if (verb === 'delete' || verb === 'deactivate' || verb === 'reject') return 'red';
  if (verb === 'create' || verb === 'activate' || verb === 'approve' || verb === 'run') return 'green';
  if (verb === 'reset_password' || verb === 'role_change') return 'gold';
  return 'blue';
}

/** Drops the `<entityType>.` prefix (already its own table column) and title-cases the verb. */
export function formatAuditAction(action: string): string {
  const verb = action.split('.').pop() ?? action;
  return verb
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
