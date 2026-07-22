import {
  AnalyticsIcon,
  ApprovalIcon,
  AttendanceIcon,
  BadgeIcon,
  ConfigIcon,
  DashboardIcon,
  EventIcon,
  FinanceIcon,
  MembersIcon,
  ProfileIcon,
  ReportIcon,
  SettingsIcon,
  TroopLeaderIcon,
  type IconType,
} from '@/shared/components/icons';

export interface NavItem {
  href: string;
  label: string;
  icon: IconType;
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
 * Phase 0 renders every item for every visitor: there is no session yet. Role
 * filtering (`admin` / `executive_council` / `troop_leader`) is feature 1.2, which
 * wires this list to the authenticated user. Do not add a role field here until
 * then — the role must come from the session, never from the client.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { href: '/organizations', label: 'Councils & Troops', icon: TroopLeaderIcon },
      { href: '/members', label: 'Membership Registry', icon: MembersIcon },
      { href: '/approvals', label: 'Pending Approvals', icon: ApprovalIcon },
    ],
  },
  {
    label: 'Activities',
    items: [
      { href: '/events', label: 'Event Management', icon: EventIcon },
      { href: '/attendance', label: 'Attendance', icon: AttendanceIcon },
      { href: '/badges', label: 'Badges', icon: BadgeIcon },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/finance', label: 'Financial Tracking', icon: FinanceIcon },
      { href: '/reports', label: 'Report Generation', icon: ReportIcon },
      { href: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'My Profile', icon: ProfileIcon },
      { href: '/settings', label: 'Settings', icon: SettingsIcon },
      { href: '/gallery', label: 'Component Gallery', icon: ConfigIcon },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

/** Page title for the topbar, resolved from the current path. */
export function resolvePageTitle(pathname: string): string {
  const match = ALL_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label ?? 'GSP Portal';
}
