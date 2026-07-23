import {
  ActivityIcon,
  BadgeIcon,
  CouncilIcon,
  ScoutLevelIcon,
  TroopLeaderIcon,
} from '@/shared/components/icons';
import type { TabItem } from '@/shared/components/ui';

import type { CategoryFormValues, CouncilFormValues, OrganizationTabId, TroopFormValues } from './types';

export const ORGANIZATION_TABS: (TabItem & { id: OrganizationTabId })[] = [
  { id: 'councils', label: 'Councils', icon: CouncilIcon },
  { id: 'troops', label: 'Troops', icon: TroopLeaderIcon },
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

export const EMPTY_CATEGORY_FORM_VALUES: CategoryFormValues = {
  name: '',
  description: '',
  orderNumber: undefined,
};
