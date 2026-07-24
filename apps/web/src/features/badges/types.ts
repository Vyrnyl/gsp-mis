/** Mirrors the `MemberBadgeStatus` enum in `apps/api/prisma/schema.prisma`. */
export type MemberBadgeStatus = 'in_progress' | 'earned' | 'verified';

export type ViewState = 'loading' | 'error' | 'ready';
export type BadgeTabId = 'catalog' | 'progress' | 'achievements';

export interface BadgeCategoryOption {
  id: string;
  name: string;
}

export interface MemberOption {
  id: string;
  fullName: string;
  troopName: string | null;
}

/** `GET /badges` row — the catalog. */
export interface BadgeCatalogItem {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  requiredPoints: number;
  requirements: string[];
  earnedCount: number;
}

export interface BadgeFormValues {
  name: string;
  description: string;
  categoryId: string;
  requiredPoints: number | undefined;
  requirements: string[];
}

/** One member's status on one catalog badge — flattened rows under Member Progress. */
export interface MemberBadgeRecord {
  id: string;
  memberId: string;
  memberName: string;
  troopName: string | null;
  badgeId: string;
  badgeName: string;
  badgeCategoryName: string | null;
  status: MemberBadgeStatus;
  earnedAt: string | null;
  verifiedByName: string | null;
}

/** Aggregated per-member row for the Progress tab. */
export interface MemberProgressSummary {
  memberId: string;
  memberName: string;
  troopName: string | null;
  totalBadges: number;
  earnedCount: number;
  progressPercent: number;
  badges: MemberBadgeRecord[];
}

/** No `notes` field — `MemberBadge` has no such column, only `status`/`earnedAt`/`verifiedById`. */
export interface RecordBadgeFormValues {
  memberId: string;
  badgeId: string;
  status: 'in_progress' | 'earned';
}

export interface AchievementRecordSummary {
  id: string;
  memberId: string;
  memberName: string;
  troopName: string | null;
  achievementName: string;
  description: string | null;
  achievedAt: string;
  recordedByName: string | null;
}

export interface AchievementFormValues {
  memberId: string;
  achievementName: string;
  description: string;
  achievedAt: string;
}
