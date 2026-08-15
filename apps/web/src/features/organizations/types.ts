export type OrganizationTabId =
  | 'councils'
  | 'troops'
  | 'schools'
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

/** Sponsoring school/institution a member may be affiliated with — scoped to a council like Troop. */
export interface School {
  id: string;
  name: string;
  councilId: string;
  councilName: string;
  memberCount: number;
  createdAt: string;
}

export interface SchoolFormValues {
  name: string;
  councilId: string;
}

/**
 * Shared shape for the three simple lookup tables — scout levels, badge categories,
 * activity categories. `orderNumber` is scout-levels-only and `icon` is
 * badge-categories-only; both stay optional so the other two tabs are unaffected.
 */
export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  orderNumber?: number;
  /** Badge categories only — a key from `BADGE_CATEGORY_ICONS`. */
  icon?: string;
  usageCount: number;
}

export interface CategoryFormValues {
  name: string;
  description: string;
  orderNumber?: number;
  icon?: string;
}
