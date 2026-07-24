import type { Metadata } from 'next';

import { ResetPasswordCard } from '@/features/auth/components/reset-password-card';

export const metadata: Metadata = {
  title: 'Reset Password',
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient-auth p-5">
      <ResetPasswordCard token={token ?? null} />
    </div>
  );
}
