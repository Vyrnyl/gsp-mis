import type { AuthRoleId } from '@/features/auth/types';
import { TableAvatar } from '@/shared/components/ui';
import { ROLE_LABELS } from '@/shared/constants/roles';

export interface ProfileHeaderProps {
  fullName: string;
  email: string;
  role: AuthRoleId;
}

/**
 * Registry §3 "Profile header" — replaces `.profile-header`/`.profile-avatar-lg`/
 * `.profile-info`/`.role-tag`. Reuses `TableAvatar`'s initials logic at a larger size
 * rather than building a second avatar component (per the avatar-scope decision, this
 * app has no uploaded profile pictures anywhere — initials are the house pattern).
 *
 * Takes plain fields rather than `AuthUser`/`ProfileSummary` directly — `ProfileView`
 * feeds it the session's data until the real fetch resolves, then the freshly-saved
 * profile after an edit. Binding this to the stale session value alone would leave a
 * user's own name/email out of date here until their next login.
 */
export function ProfileHeader({ fullName, email, role }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-card bg-brand-gradient p-7 text-center text-white sm:flex-row sm:text-left">
      <TableAvatar name={fullName} className="size-20 shrink-0 bg-white/25 text-[1.6rem] text-white" />
      <div className="min-w-0">
        <h2 className="truncate text-[1.3rem] font-bold">{fullName}</h2>
        <p className="truncate text-[0.9rem] opacity-85">{email}</p>
        <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[0.8rem] font-semibold">
          {ROLE_LABELS[role]}
        </span>
      </div>
    </div>
  );
}
