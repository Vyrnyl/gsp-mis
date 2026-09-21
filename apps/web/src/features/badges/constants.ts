import type { BadgeTone } from '@/shared/components/ui';

import type {
  AchievementFormValues,
  BadgeFormValues,
  MemberBadgeStatus,
  MemberOption,
  RecordBadgeFormValues,
  BadgeTabId,
} from './types';

/**
 * One label for every member picker in this feature — the Record Badge and Achievement
 * modals read the same fetched array, so the same member must read identically in both.
 *
 * Troop and scout level are each omitted when absent rather than rendered as a
 * placeholder: an adult leader has no level by design (not missing data), and a
 * "No level" suffix on every leader row would be noise in a list you scan by name.
 *
 * The qualifiers are parenthesised rather than joined to the name with an em-dash,
 * because troop names contain em-dashes themselves ("Troop 7 — San Andres"): the old
 * `Name — Troop` form produced "Kyla Odtuhan — Troop 7 — San Andres · Junior Girl
 * Scout", where two identical-looking dashes mean different things. Parentheses keep
 * the name — the part you scan for — unambiguously first.
 */
export function formatMemberOptionLabel(member: MemberOption): string {
  const qualifiers = [member.troopName, member.scoutLevelName].filter(Boolean);
  return qualifiers.length > 0 ? `${member.fullName} (${qualifiers.join(' · ')})` : member.fullName;
}

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
