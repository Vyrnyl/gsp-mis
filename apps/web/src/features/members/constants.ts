import type { BadgeTone } from '@/shared/components/ui';

import type { Gender, MemberStatusId, MemberType } from './types';

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  scout: 'Scout',
  adult_leader: 'Adult Leader',
};

export const MEMBER_TYPE_OPTIONS = [
  { value: 'scout', label: 'Scout' },
  { value: 'adult_leader', label: 'Adult Leader' },
] as const;

export const GENDER_LABELS: Record<Gender, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  undisclosed: 'Prefer not to say',
};

export const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as Gender[]).map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

export const MEMBER_STATUS_LABELS: Record<MemberStatusId, string> = {
  pending: 'Pending Review',
  active: 'Active',
  expiring: 'Expiring Soon',
  expired: 'Expired',
  archived: 'Archived',
  rejected: 'Rejected',
};

export const MEMBER_STATUS_TONES: Record<MemberStatusId, BadgeTone> = {
  pending: 'blue',
  active: 'green',
  expiring: 'gold',
  expired: 'red',
  archived: 'gray',
  rejected: 'red',
};

export const MEMBER_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...(Object.keys(MEMBER_STATUS_LABELS) as MemberStatusId[]).map((value) => ({
    value,
    label: MEMBER_STATUS_LABELS[value],
  })),
];

export const EMPTY_MEMBER_FORM_VALUES = {
  memberType: 'scout' as MemberType,
  firstName: '',
  middleName: '',
  lastName: '',
  birthDate: '',
  gender: 'female' as Gender,
  email: '',
  phoneNumber: '',
  address: '',
  troopId: '',
  scoutLevelId: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  notes: '',
};
