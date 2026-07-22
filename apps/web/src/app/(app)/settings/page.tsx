import type { Metadata } from 'next';

import { PlaceholderPage } from '@/shared/components/layout/placeholder-page';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="System configuration, user management and the audit log."
      feature="3.4"
    />
  );
}
