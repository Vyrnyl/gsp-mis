import {
  ActivityIcon,
  BADGE_CATEGORY_ICON_LABELS,
  BADGE_CATEGORY_ICONS,
  BadgeIcon,
  CouncilIcon,
  DEFAULT_BADGE_CATEGORY_ICON,
  LocationIcon,
  SchoolIcon,
  ScoutLevelIcon,
  TroopLeaderIcon,
} from '@/shared/components/icons';
import type { IconPickerOption, TabItem } from '@/shared/components/ui';

import type {
  CategoryFormValues,
  CouncilFormValues,
  MunicipalityFormValues,
  OrganizationTabId,
  SchoolFormValues,
  TroopFormValues,
} from './types';

export const ORGANIZATION_TABS: (TabItem & { id: OrganizationTabId })[] = [
  { id: 'councils', label: 'Councils', icon: CouncilIcon },
  { id: 'troops', label: 'Troops', icon: TroopLeaderIcon },
  { id: 'municipalities', label: 'Municipalities', icon: LocationIcon },
  { id: 'schools', label: 'Schools', icon: SchoolIcon },
  { id: 'scout-levels', label: 'Scout Levels', icon: ScoutLevelIcon },
  { id: 'badge-categories', label: 'Badge Categories', icon: BadgeIcon },
  { id: 'activity-categories', label: 'Activity Categories', icon: ActivityIcon },
];

export const EMPTY_COUNCIL_FORM_VALUES: CouncilFormValues = {
  name: '',
  description: '',
};

export const EMPTY_TROOP_FORM_VALUES: TroopFormValues = {
  troopCode: '',
  name: '',
  councilId: '',
  leaderId: '',
};

export const EMPTY_MUNICIPALITY_FORM_VALUES: MunicipalityFormValues = {
  name: '',
  councilId: '',
};

export const EMPTY_SCHOOL_FORM_VALUES: SchoolFormValues = {
  name: '',
  councilId: '',
  municipalityId: '',
};

/** Schools tab filter values that aren't a municipality id. */
export const ALL_MUNICIPALITIES = 'all';
export const UNASSIGNED_MUNICIPALITY = 'unassigned';

export const EMPTY_CATEGORY_FORM_VALUES: CategoryFormValues = {
  name: '',
  description: '',
  orderNumber: undefined,
  icon: DEFAULT_BADGE_CATEGORY_ICON,
};

/** Picker options for the Badge Categories tab — order matches the barrel's own. */
export const BADGE_CATEGORY_ICON_OPTIONS: IconPickerOption[] = (
  Object.keys(BADGE_CATEGORY_ICONS) as (keyof typeof BADGE_CATEGORY_ICONS)[]
).map((key) => ({
  value: key,
  icon: BADGE_CATEGORY_ICONS[key],
  label: BADGE_CATEGORY_ICON_LABELS[key],
}));
