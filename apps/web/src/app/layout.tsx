import type { Metadata, Viewport } from 'next';

import { ToastProvider } from '@/shared/components/ui/toast';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'GSP Management Information System',
    template: '%s · GSP Portal',
  },
  description:
    'Membership, events, attendance, badges, finance and reporting for the Girl Scouts of the Philippines.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a6b3c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
