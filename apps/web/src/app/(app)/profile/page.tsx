import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'My Profile' };

export default function ProfilePage() {
  return (
    <PlaceholderPage
      title="My Profile"
      description="Your account details and password."
      feature="3.5"
    />
  );
}
