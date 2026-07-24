import type { RoleName } from '../../shared/constants/roles';
import type { UpdateProfileInput } from './profile.schema';

export type UpdateProfileRequestBody = UpdateProfileInput;

/** `GET`/`PUT /profile` — the signed-in user's own account (build-plan.md §3.5). */
export interface ProfileDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: RoleName;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ChangePasswordResponseBody {
  changed: true;
}
