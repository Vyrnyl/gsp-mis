'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '@/features/auth/types';
import { useToast } from '@/shared/components/ui';

import { changePassword, getProfile, updateProfile } from '../services/profile.service';
import type { ChangePasswordFormValues, ProfileFormValues, ProfileSummary, ViewState } from '../types';
import { ChangePasswordForm } from './change-password-form';
import { ProfileHeader } from './profile-header';
import { ProfileInfoForm } from './profile-info-form';

export interface ProfileViewProps {
  user: AuthUser;
}

/**
 * Feature 3.5 — Profile Management. Contract + Wire Read + Wire Write built together,
 * matching every prior Phase 3 feature. Every role lands here for their own account —
 * distinct from 3.4's `UsersPanel`, which is an Administrator editing *other* users'
 * accounts and roles.
 */
export function ProfileView({ user }: ProfileViewProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await getProfile();
      setProfile(result);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Errors are left to propagate — `ProfileInfoForm` catches and renders its own
  // inline `Alert` (an email conflict is a field-relevant error, same precedent as
  // 3.4's `UserFormModal`, not a toast-and-forget one).
  async function handleSaveProfile(values: ProfileFormValues) {
    setIsSavingProfile(true);
    try {
      const updated = await updateProfile(values);
      setProfile(updated);
      showToast('Profile updated.', 'success');
      // The sidebar's name/role chip comes from the server layout's session read
      // (`AppShell`'s `user` prop), which a client-side save never touches on its own —
      // same staleness `handleSignOut` already works around in `app-shell.tsx`.
      router.refresh();
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Same reasoning — `ChangePasswordForm` shows "Current password is incorrect."
  // inline rather than in a toast that vanishes before it's read.
  async function handleChangePassword(values: ChangePasswordFormValues) {
    setIsSavingPassword(true);
    try {
      await changePassword(values);
      showToast('Password updated.', 'success');
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      <ProfileHeader
        fullName={profile?.fullName ?? user.fullName}
        email={profile?.email ?? user.email}
        role={profile?.role ?? user.role}
      />

      <ProfileInfoForm
        viewState={viewState}
        profile={profile}
        isSaving={isSavingProfile}
        onRetry={fetchProfile}
        onSave={handleSaveProfile}
      />

      <ChangePasswordForm isSaving={isSavingPassword} onSave={handleChangePassword} />
    </div>
  );
}
