import type { Metadata } from 'next';

import { AuthCard } from '@/features/auth/components/auth-card';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient-auth p-5">
      <AuthCard />
    </div>
  );
}
