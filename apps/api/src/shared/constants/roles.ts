/**
 * The three seeded roles (build-plan.md §7).
 *
 * Roles are relational — a user's role comes from `user_roles`, never from a column
 * on `users`. These constants name the seeded rows; they are not a substitute for
 * reading the join table.
 */
export const ROLES = {
  ADMIN: 'admin',
  EXECUTIVE_COUNCIL: 'executive_council',
  TROOP_LEADER: 'troop_leader',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: RoleName[] = [ROLES.ADMIN, ROLES.EXECUTIVE_COUNCIL, ROLES.TROOP_LEADER];

/**
 * Permission names seeded into `permissions` and linked through `role_permissions`.
 * Kept as a flat `<domain>:<action>` list so RBAC middleware can check one string.
 */
export const PERMISSIONS = {
  MEMBERS_READ: 'members:read',
  MEMBERS_WRITE: 'members:write',
  MEMBERS_APPROVE: 'members:approve',
  MEMBERS_ARCHIVE: 'members:archive',
  ORGANIZATIONS_READ: 'organizations:read',
  ORGANIZATIONS_WRITE: 'organizations:write',
  EVENTS_READ: 'events:read',
  EVENTS_WRITE: 'events:write',
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_WRITE: 'attendance:write',
  BADGES_READ: 'badges:read',
  BADGES_WRITE: 'badges:write',
  BADGES_VERIFY: 'badges:verify',
  ACTIVITY_REPORTS_READ: 'activity-reports:read',
  ACTIVITY_REPORTS_WRITE: 'activity-reports:write',
  FINANCE_READ: 'finance:read',
  FINANCE_WRITE: 'finance:write',
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_READ: 'analytics:read',
  NOTIFICATIONS_READ: 'notifications:read',
  ANNOUNCEMENTS_WRITE: 'announcements:write',
  USERS_MANAGE: 'users:manage',
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_LOGS_READ: 'audit-logs:read',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Which permissions each seeded role receives. Consumed by `prisma/seed.ts`. */
export const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EXECUTIVE_COUNCIL]: [
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_WRITE,
    PERMISSIONS.MEMBERS_APPROVE,
    PERMISSIONS.MEMBERS_ARCHIVE,
    PERMISSIONS.ORGANIZATIONS_READ,
    PERMISSIONS.EVENTS_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.BADGES_READ,
    PERMISSIONS.ACTIVITY_REPORTS_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.ANNOUNCEMENTS_WRITE,
  ],
  [ROLES.TROOP_LEADER]: [
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_WRITE,
    PERMISSIONS.ORGANIZATIONS_READ,
    PERMISSIONS.EVENTS_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.BADGES_READ,
    PERMISSIONS.BADGES_WRITE,
    PERMISSIONS.ACTIVITY_REPORTS_READ,
    PERMISSIONS.ACTIVITY_REPORTS_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.NOTIFICATIONS_READ,
  ],
};
