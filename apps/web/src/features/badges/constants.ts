import type { BadgeTone } from '@/shared/components/ui';

import type {
  AchievementFormValues,
  BadgeFormValues,
  MemberBadgeStatus,
  RecordBadgeFormValues,
  BadgeTabId,
} from './types';

export const MEMBER_BADGE_STATUS_LABELS: Record<MemberBadgeStatus, string> = {
  in_progress: 'In Progress',
  earned: 'Earned',
  verified: 'Verified',
};

/** Verified is the final, fully-confirmed state (green) — same convention as members' `active`. */
export const MEMBER_BADGE_STATUS_TONES: Record<MemberBadgeStatus, BadgeTone> = {
  in_progress: 'blue',
  earned: 'gold',
  verified: 'green',
};

export const BADGE_TABS: { id: BadgeTabId; label: string }[] = [
  { id: 'catalog', label: 'Badge Catalog' },
  { id: 'progress', label: 'Member Progress' },
  { id: 'achievements', label: 'Achievement History' },
];

export const EMPTY_BADGE_FORM_VALUES: BadgeFormValues = {
  name: '',
  description: '',
  categoryId: '',
  requiredPoints: undefined,
  requirements: [''],
};

export const EMPTY_RECORD_BADGE_FORM_VALUES: RecordBadgeFormValues = {
  memberId: '',
  badgeId: '',
  status: 'in_progress',
};

export const EMPTY_ACHIEVEMENT_FORM_VALUES: AchievementFormValues = {
  memberId: '',
  achievementName: '',
  description: '',
  achievedAt: new Date().toISOString().slice(0, 10),
};
