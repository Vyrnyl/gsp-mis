/** Mirrors the `MemberType` enum in `apps/api/prisma/schema.prisma`. */
export type MemberType = 'scout' | 'adult_leader';

/** Mirrors the `Gender` enum in `apps/api/prisma/schema.prisma`. */
export type Gender = 'female' | 'male' | 'other' | 'undisclosed';

/**
 * Mirrors the seeded `member_statuses` rows. `pending`/`rejected` are driven by the
 * 1.4 approval workflow, not editable here — this feature only ever writes
 * `active` (on create), `archived`/`active` (archive/restore), or lets a Membership
 * term roll a member into `expiring`/`expired`.
 */
export type MemberStatusId = 'pending' | 'active' | 'expiring' | 'expired' | 'archived' | 'rejected';

export type MembershipState = 'active' | 'expiring' | 'expired' | 'cancelled';

export interface TroopOption {
  id: string;
  troopCode: string;
  name: string;
  councilId: string;
  councilName: string;
}

export interface ScoutLevelOption {
  id: string;
  name: string;
  orderNumber: number;
}

/** One term on the member's `memberships` history — renewal appends a new row. */
export interface MembershipTerm {
  id: string;
  startDate: string;
  endDate: string;
  renewalDate: string | null;
  status: MembershipState;
}

/** `GET /members` row shape — light enough for a paginated directory table. */
export interface MemberSummary {
  id: string;
  memberType: MemberType;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  status: MemberStatusId;
  troop: { id: string; troopCode: string; name: string } | null;
  scoutLevel: { id: string; name: string } | null;
  createdAt: string;
}

/** `GET /members/:id` — the full profile, including membership history. */
export interface Member extends MemberSummary {
  birthDate: string | null;
  gender: Gender;
  phoneNumber: string | null;
  address: string | null;
  councilName: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  rejectionReason: string | null;
  memberships: MembershipTerm[];
}

export interface MemberFormValues {
  memberType: MemberType;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  email: string;
  phoneNumber: string;
  address: string;
  troopId: string;
  scoutLevelId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
}

export interface RenewMembershipValues {
  startDate: string;
  endDate: string;
}

export type MemberStatusFilter = MemberStatusId | 'all';
export type MemberTypeFilter = MemberType | 'all';
