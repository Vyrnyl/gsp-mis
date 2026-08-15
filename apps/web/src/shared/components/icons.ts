/**
 * Central icon map.
 *
 * Settled decision (build-plan.md §7): the prototype's emoji are replaced with
 * `react-icons` components. Every icon in the app is re-exported from here under a
 * semantic name so the icon set can be swapped in one place and so no screen picks
 * its own near-duplicate glyph.
 *
 * Icon-only buttons must still carry an `aria-label` (ui-rules.md §9).
 */
export {
  FiActivity as ActivityIcon,
  FiAlertCircle as AlertIcon,
  FiAlertTriangle as WarningIcon,
  FiArchive as ArchiveIcon,
  FiAward as BadgeIcon,
  FiBarChart2 as AnalyticsIcon,
  FiBell as NotificationIcon,
  FiCalendar as EventIcon,
  FiCheck as CheckIcon,
  FiCheckCircle as SuccessIcon,
  FiCheckSquare as AttendanceIcon,
  FiChevronDown as ChevronDownIcon,
  FiChevronLeft as ChevronLeftIcon,
  FiChevronRight as ChevronRightIcon,
  FiClipboard as ReportIcon,
  FiClock as ClockIcon,
  FiDollarSign as FinanceIcon,
  FiDownload as DownloadIcon,
  FiEdit2 as EditIcon,
  FiEye as EyeIcon,
  FiEyeOff as EyeOffIcon,
  FiFileText as DocumentIcon,
  FiFilter as FilterIcon,
  FiGrid as DashboardIcon,
  FiDatabase as BackupIcon,
  FiInbox as EmptyIcon,
  FiInfo as InfoIcon,
  FiKey as PasswordIcon,
  FiLayers as ScoutLevelIcon,
  FiList as ListViewIcon,
  FiLoader as SpinnerIcon,
  FiLogOut as LogoutIcon,
  FiMapPin as LocationIcon,
  FiMenu as MenuIcon,
  FiPlus as AddIcon,
  FiRefreshCw as RetryIcon,
  FiRotateCcw as RestoreIcon,
  FiSearch as SearchIcon,
  FiSettings as SettingsIcon,
  FiShield as AdminIcon,
  FiSliders as ConfigIcon,
  FiTrash2 as DeleteIcon,
  FiPocket as BalanceIcon,
  FiTrendingDown as ExpenseIcon,
  FiTrendingUp as IncomeIcon,
  FiUser as ProfileIcon,
  FiUserCheck as ApprovalIcon,
  FiUsers as MembersIcon,
  FiX as CloseIcon,
  FiXCircle as RejectIcon,
} from 'react-icons/fi';

export {
  FaBullhorn as AnnouncementIcon,
  FaCampground as TroopLeaderIcon,
  FaGraduationCap as SchoolIcon,
  FaLandmark as CouncilIcon,
} from 'react-icons/fa6';

export type { IconType } from 'react-icons';

import type { IconType } from 'react-icons';
import {
  FiAward,
  FiBookOpen,
  FiCompass,
  FiDroplet,
  FiFlag,
  FiGlobe,
  FiHeart,
  FiLifeBuoy,
  FiMusic,
  FiStar,
  FiSun,
  FiTool,
} from 'react-icons/fi';

/**
 * Curated icon set an Admin may assign to a badge category (1.6 → 2.4 revision).
 *
 * Only the **key** is persisted — never a `react-icons` component name — so the icon
 * set stays swappable from this one file, which is the whole point of this barrel.
 * All twelve are Feather (`fi`) on purpose: mixing Feather's outline stroke with
 * fa6's solid glyphs in a single picker grid reads as a rendering bug.
 *
 * Adding a key here is safe. Removing one is not — existing rows would fall back to
 * `award` via `resolveBadgeCategoryIcon`. Keep it in sync with the API's own copy in
 * `apps/api/src/modules/organizations/organizations.schema.ts` (same hand-mirrored
 * cross-workspace convention as every other contract in this repo).
 */
export const BADGE_CATEGORY_ICONS = {
  award: FiAward,
  heart: FiHeart,
  compass: FiCompass,
  lifebuoy: FiLifeBuoy,
  flag: FiFlag,
  music: FiMusic,
  book: FiBookOpen,
  globe: FiGlobe,
  tool: FiTool,
  star: FiStar,
  sun: FiSun,
  droplet: FiDroplet,
} as const satisfies Record<string, IconType>;

export type BadgeCategoryIconKey = keyof typeof BADGE_CATEGORY_ICONS;

/** Human-readable labels for the picker's accessible names. */
export const BADGE_CATEGORY_ICON_LABELS: Record<BadgeCategoryIconKey, string> = {
  award: 'Award',
  heart: 'Heart',
  compass: 'Compass',
  lifebuoy: 'Life buoy',
  flag: 'Flag',
  music: 'Music note',
  book: 'Open book',
  globe: 'Globe',
  tool: 'Tools',
  star: 'Star',
  sun: 'Sun',
  droplet: 'Droplet',
};

export const DEFAULT_BADGE_CATEGORY_ICON: BadgeCategoryIconKey = 'award';

export function isBadgeCategoryIconKey(value: unknown): value is BadgeCategoryIconKey {
  return typeof value === 'string' && value in BADGE_CATEGORY_ICONS;
}

/**
 * Never throws on an unknown key — a bad row falls back to the generic award glyph
 * rather than blanking the catalog grid it appears in.
 */
export function resolveBadgeCategoryIcon(key: string | null | undefined): IconType {
  return isBadgeCategoryIconKey(key) ? BADGE_CATEGORY_ICONS[key] : BADGE_CATEGORY_ICONS[DEFAULT_BADGE_CATEGORY_ICON];
}
