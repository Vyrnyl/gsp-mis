import type { AuthRoleId } from '@/features/auth/types';

export type ViewState = 'loading' | 'error' | 'ready';

/** `GET /api/v1/profile` response shape — the signed-in user's own account. */
export interface ProfileSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: AuthRoleId;
  createdAt: string;
  lastLoginAt: string | null;
}

/** `PUT /api/v1/profile` request body. */
export interface ProfileFormValues {
  fullName: string;
  email: string;
  phoneNumber: string;
}

/** `POST /api/v1/profile/change-password` request body. */
export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
