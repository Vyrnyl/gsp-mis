import {
  AnalyticsIcon,
  AnnouncementIcon,
  ApprovalIcon,
  AttendanceIcon,
  BadgeIcon,
  ConfigIcon,
  DashboardIcon,
  DocumentIcon,
  EventIcon,
  FinanceIcon,
  MembersIcon,
  ProfileIcon,
  ReportIcon,
  SettingsIcon,
  TroopLeaderIcon,
  type IconType,
} from '@/shared/components/icons';
import { roleHasPermission, type PermissionName } from '@/shared/constants/roles';

import type { AuthRoleId } from '@/features/auth/types';

export interface NavItem {
  href: string;
  label: string;
  icon: IconType;
  /** Omitted = visible to every authenticated role (e.g. Dashboard, My Profile). */
  permission?: PermissionName;
  /** Optional count pill (e.g. pending approvals). Wired to real data in Phase 1. */
  badgeCount?: number;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Sidebar navigation — registry §2.
 *
 * Every item declares the permission that gates it (`shared/constants/roles.ts`,
 * hand-synced with the API's `role_permissions`). Feature 1.2 filters this list
 * against the authenticated user's role via `getNavSectionsForRole` — never render
 * `NAV_SECTIONS` directly in the shell.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      {
        href: '/organizations',
        label: 'Councils & Troops',
        icon: TroopLeaderIcon,
        permission: 'organizations:read',
      },
      { href: '/members', label: 'Membership Registry', icon: MembersIcon, permission: 'members:read' },
      {
        href: '/approvals',
        label: 'Pending Approvals',
        icon: ApprovalIcon,
        permission: 'members:approve',
      },
    ],
  },
  {
    label: 'Activities',
    items: [
      { href: '/events', label: 'Event Management', icon: EventIcon, permission: 'events:read' },
      { href: '/attendance', label: 'Attendance', icon: AttendanceIcon, permission: 'attendance:read' },
      {
        href: '/activity-reports',
        label: 'Activity Reports',
        icon: DocumentIcon,
        permission: 'activity-reports:read',
      },
      { href: '/badges', label: 'Badges', icon: BadgeIcon, permission: 'badges:read' },
      { href: '/announcements', label: 'Announcements', icon: AnnouncementIcon },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/finance', label: 'Financial Tracking', icon: FinanceIcon, permission: 'finance:read' },
      { href: '/reports', label: 'Report Generation', icon: ReportIcon, permission: 'reports:read' },
      { href: '/analytics', label: 'Analytics', icon: AnalyticsIcon, permission: 'analytics:read' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'My Profile', icon: ProfileIcon },
      { href: '/settings', label: 'Settings', icon: SettingsIcon, permission: 'settings:manage' },
      { href: '/gallery', label: 'Component Gallery', icon: ConfigIcon },
    ],
  },
];

/**
 * Filters `NAV_SECTIONS` down to what `role` may see, dropping any section left
 * with no items. Gallery is the component QA page, not a real module — it has no
 * permission gate and stays visible to every authenticated role.
 */
export function getNavSectionsForRole(role: AuthRoleId): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || roleHasPermission(role, item.permission)),
  })).filter((section) => section.items.length > 0);
}

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

/** Page title for the topbar, resolved from the current path. */
export function resolvePageTitle(pathname: string): string {
  const match = ALL_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label ?? 'GSP Portal';
}
