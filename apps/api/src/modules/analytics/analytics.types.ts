export interface AnalyticsStatValueDto {
  id: string;
  label: string;
  value: number | string;
}

export interface TrendPointDto {
  label: string;
  value: number;
}

export interface MonthlyFinancePointDto {
  label: string;
  income: number;
  expense: number;
}

export interface MembershipAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  trend: TrendPointDto[];
}

export interface AttendanceAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  trend: TrendPointDto[];
}

export interface EventParticipationDto {
  eventId: string;
  eventTitle: string;
  registrations: number;
  attendanceRate: number;
}

export interface ParticipationAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  byEvent: EventParticipationDto[];
}

export interface BadgeCompletionSliceDto {
  badgeId: string;
  badgeName: string;
  completionRate: number;
}

export interface BadgeAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  completionByBadge: BadgeCompletionSliceDto[];
}

export interface FinancialAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  trend: MonthlyFinancePointDto[];
}

export interface TroopPerformanceDto {
  troopId: string;
  troopName: string;
  memberCount: number;
  attendanceRate: number;
  badgesEarned: number;
}

export interface OrganizationAnalyticsDto {
  stats: AnalyticsStatValueDto[];
  troops: TroopPerformanceDto[];
}

export interface AnalyticsSnapshotDto {
  membership: MembershipAnalyticsDto;
  attendance: AttendanceAnalyticsDto;
  participation: ParticipationAnalyticsDto;
  badges: BadgeAnalyticsDto;
  financial: FinancialAnalyticsDto;
  organization: OrganizationAnalyticsDto;
  generatedAt: string;
}
