import type { AuthRoleId } from '@/features/auth/types';

/**
 * Hand-synced mirror of `apps/api/src/shared/constants/roles.ts` §permissions — the
 * two workspaces don't share a types package, so these must match by hand (same
 * convention as `AuthRoleId` in `features/auth/types.ts`). Used to filter nav items
 * and gate routes client-side; the API's `requireRole`/`requirePermission` middleware
 * is the real enforcement, this is UX only.
 */
export type PermissionName =
  | 'members:read'
  | 'members:write'
  | 'members:approve'
  | 'members:archive'
  | 'organizations:read'
  | 'organizations:write'
  | 'events:read'
  | 'events:write'
  | 'attendance:read'
  | 'attendance:write'
  | 'badges:read'
  | 'badges:write'
  | 'badges:verify'
  | 'activity-reports:read'
  | 'activity-reports:write'
  | 'finance:read'
  | 'finance:write'
  | 'reports:read'
  | 'reports:export'
  | 'analytics:read'
  | 'notifications:read'
  | 'announcements:write'
  | 'users:manage'
  | 'roles:manage'
  | 'settings:manage'
  | 'audit-logs:read';

export const ROLE_PERMISSIONS: Record<AuthRoleId, PermissionName[]> = {
  admin: [
    'members:read',
    'members:write',
    'members:approve',
    'members:archive',
    'organizations:read',
    'organizations:write',
    'events:read',
    'events:write',
    'attendance:read',
    'attendance:write',
    'badges:read',
    'badges:write',
    'badges:verify',
    'activity-reports:read',
    'activity-reports:write',
    'finance:read',
    'finance:write',
    'reports:read',
    'reports:export',
    'analytics:read',
    'notifications:read',
    'announcements:write',
    'users:manage',
    'roles:manage',
    'settings:manage',
    'audit-logs:read',
  ],
  executive_council: [
    'members:read',
    'members:write',
    'members:approve',
    'members:archive',
    'organizations:read',
    'events:read',
    'attendance:read',
    'badges:read',
    'activity-reports:read',
    'finance:read',
    'finance:write',
    'reports:read',
    'reports:export',
    'analytics:read',
    'notifications:read',
    'announcements:write',
  ],
  troop_leader: [
    'members:read',
    'members:write',
    'organizations:read',
    'events:read',
    'attendance:read',
    'attendance:write',
    'badges:read',
    'badges:write',
    'activity-reports:read',
    'activity-reports:write',
    'reports:read',
    'notifications:read',
  ],
};

export function roleHasPermission(role: AuthRoleId, permission: PermissionName): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Route-prefix → required permission, hand-synced with each `NavItem.permission` in
 * `layout/nav-items.ts`. Kept separate (rather than importing nav-items) so the edge
 * middleware doesn't have to pull in nav-items' `react-icons` imports.
 */
export const ROUTE_PERMISSIONS: Partial<Record<string, PermissionName>> = {
  '/organizations': 'organizations:read',
  '/members': 'members:read',
  '/approvals': 'members:approve',
  '/events': 'events:read',
  '/attendance': 'attendance:read',
  '/activity-reports': 'activity-reports:read',
  '/badges': 'badges:read',
  '/finance': 'finance:read',
  '/reports': 'reports:read',
  '/analytics': 'analytics:read',
  '/settings': 'settings:manage',
};

export function getRequiredPermissionForPath(pathname: string): PermissionName | undefined {
  const prefix = Object.keys(ROUTE_PERMISSIONS).find(
    (candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`),
  );
  return prefix ? ROUTE_PERMISSIONS[prefix] : undefined;
}

/** Human-readable labels, matching `ROLE_OPTIONS` in `features/auth/components/role-selector.tsx`. */
export const ROLE_LABELS: Record<AuthRoleId, string> = {
  admin: 'Administrator',
  executive_council: 'Executive Council',
  troop_leader: 'Troop Leader',
};
