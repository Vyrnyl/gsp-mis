export interface CouncilDto {
  id: string;
  name: string;
  description: string | null;
  troopCount: number;
  memberCount: number;
  createdAt: string;
}

export interface TroopDto {
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

export interface ScoutLevelDto {
  id: string;
  name: string;
  description: string | null;
  orderNumber: number;
  usageCount: number;
}

export interface BadgeCategoryDto {
  id: string;
  name: string;
  description: string | null;
  /** Semantic key from `BADGE_CATEGORY_ICON_KEYS` — the web side maps it to a component. */
  icon: string;
  usageCount: number;
}

export interface ActivityCategoryDto {
  id: string;
  name: string;
  description: string | null;
  usageCount: number;
}

export interface TroopLeaderOptionDto {
  id: string;
  fullName: string;
  email: string;
}

export interface ListCouncilsResponseBody {
  councils: CouncilDto[];
}

export interface ListTroopsResponseBody {
  troops: TroopDto[];
}

export interface ListScoutLevelsResponseBody {
  scoutLevels: ScoutLevelDto[];
}

export interface ListBadgeCategoriesResponseBody {
  badgeCategories: BadgeCategoryDto[];
}

export interface ListActivityCategoriesResponseBody {
  activityCategories: ActivityCategoryDto[];
}

export interface ListTroopLeadersResponseBody {
  troopLeaders: TroopLeaderOptionDto[];
}
