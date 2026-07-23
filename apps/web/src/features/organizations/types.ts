export type OrganizationTabId =
  | 'councils'
  | 'troops'
  | 'scout-levels'
  | 'badge-categories'
  | 'activity-categories';

export type ViewState = 'loading' | 'error' | 'ready';

export interface Council {
  id: string;
  name: string;
  description: string | null;
  troopCount: number;
  memberCount: number;
  createdAt: string;
}

export interface CouncilFormValues {
  name: string;
  description: string;
}

export interface TroopLeaderOption {
  id: string;
  fullName: string;
  email: string;
}

/** Denormalized like `MemberSummary` — `councilName`/`leaderName` come from the API's own join. */
export interface Troop {
  id: string;
  troopCode: string;
  name: string;
  councilId: string;
  councilName: string;
  leaderId: string | null;
  leaderName: string | null;
  memberCount: number;
  createdAt: string;
}

export interface TroopFormValues {
  troopCode: string;
  name: string;
  councilId: string;
  leaderId: string;
}

/** Shared shape for the three simple lookup tables — scout levels, badge categories, activity categories. */
export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  orderNumber?: number;
  usageCount: number;
}

export interface CategoryFormValues {
  name: string;
  description: string;
  orderNumber?: number;
}
