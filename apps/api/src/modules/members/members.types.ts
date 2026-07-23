import type {
  CreateMemberInput,
  Gender,
  MemberStatusName,
  MemberType,
  RenewMembershipInput,
  UpdateMemberInput,
} from './members.schema';

export type CreateMemberRequestBody = CreateMemberInput;
export type UpdateMemberRequestBody = UpdateMemberInput;
export type RenewMembershipRequestBody = RenewMembershipInput;

export type MembershipState = 'active' | 'expiring' | 'expired' | 'cancelled';

/** One row on a member's `memberships` history — renewal appends rather than mutates. */
export interface MembershipTermDto {
  id: string;
  startDate: string;
  endDate: string;
  renewalDate: string | null;
  status: MembershipState;
}

interface MemberRelations {
  troop: { id: string; troopCode: string; name: string } | null;
  scoutLevel: { id: string; name: string } | null;
}

/** `GET /members` row shape — light enough for a paginated directory table. */
export interface MemberSummary extends MemberRelations {
  id: string;
  memberType: MemberType;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  status: MemberStatusName;
  createdAt: string;
}

/** `GET /members/:id` — the full profile, including membership history. */
export interface MemberDetail extends MemberSummary {
  birthDate: string | null;
  gender: Gender;
  phoneNumber: string | null;
  address: string | null;
  councilName: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  rejectionReason: string | null;
  memberships: MembershipTermDto[];
}

export interface ListMembersResponseBody {
  members: MemberSummary[];
}

export interface MemberResponseBody {
  member: MemberDetail;
}
