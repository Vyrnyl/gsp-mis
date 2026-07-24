import type { MemberBadgeStatus } from './badges.schema';

export interface BadgeDto {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  requiredPoints: number;
  requirements: string[];
  earnedCount: number;
}

export interface MemberBadgeRecordDto {
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

export interface MemberProgressDto {
  memberId: string;
  memberName: string;
  troopName: string | null;
  totalBadges: number;
  earnedCount: number;
  progressPercent: number;
  badges: MemberBadgeRecordDto[];
}

export interface AchievementRecordDto {
  id: string;
  memberId: string;
  memberName: string;
  troopName: string | null;
  achievementName: string;
  description: string | null;
  achievedAt: string;
  recordedByName: string | null;
}

export interface MemberOptionDto {
  id: string;
  fullName: string;
  troopName: string | null;
}

export interface ListBadgesResponseBody {
  badges: BadgeDto[];
}

export interface ListMemberOptionsResponseBody {
  members: MemberOptionDto[];
}

export interface ListMemberProgressResponseBody {
  members: MemberProgressDto[];
}

export interface ListAchievementsResponseBody {
  achievements: AchievementRecordDto[];
}
