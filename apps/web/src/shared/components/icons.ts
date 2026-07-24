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
  FiEdit2 as EditIcon,
  FiEye as EyeIcon,
  FiEyeOff as EyeOffIcon,
  FiFileText as DocumentIcon,
  FiFilter as FilterIcon,
  FiGrid as DashboardIcon,
  FiInbox as EmptyIcon,
  FiInfo as InfoIcon,
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
  FaLandmark as CouncilIcon,
} from 'react-icons/fa6';

export type { IconType } from 'react-icons';
