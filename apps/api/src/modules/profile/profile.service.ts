import type { RoleName } from '../../shared/constants/roles';
import { ApiError } from '../../shared/utils/api-error';
import { writeAuditLog } from '../../shared/utils/audit-log';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { profileRepository, type UserWithRole } from './profile.repository';
import type { ChangePasswordInput, UpdateProfileInput } from './profile.schema';
import type { ProfileDto } from './profile.types';

function resolveRole(user: UserWithRole): RoleName {
  const role = user.userRoles[0]?.role.name;
  if (!role) throw ApiError.internal(`User ${user.id} has no role assigned.`);
  return role as RoleName;
}

function toProfileDto(user: UserWithRole): ProfileDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: resolveRole(user),
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}

async function requireUser(id: string): Promise<UserWithRole> {
  const user = await profileRepository.findById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return user;
}

/**
 * Feature 3.5 — every role manages their own account here (build-plan.md §3.5),
 * distinct from 3.4's `settingsService`, which is an Administrator editing *other*
 * users' accounts and roles.
 */
export const profileService = {
  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await requireUser(userId);
    return toProfileDto(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDto> {
    await requireUser(userId);

    const existing = await profileRepository.findByEmail(input.email);
    if (existing && existing.id !== userId) {
      throw ApiError.conflict('A user with this email already exists.');
    }

    const updated = await profileRepository.update(userId, {
      fullName: input.fullName,
      email: input.email,
      phoneNumber: input.phoneNumber?.trim() || null,
    });
    await writeAuditLog({ userId, action: 'profile.update', entityType: 'user', entityId: userId });
    return toProfileDto(updated);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await requireUser(userId);

    const isCurrentPasswordValid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect.');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await profileRepository.setPasswordHash(userId, passwordHash);
    await writeAuditLog({ userId, action: 'user.change_password', entityType: 'user', entityId: userId });
  },
};
