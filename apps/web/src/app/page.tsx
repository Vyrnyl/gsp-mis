import { redirect } from 'next/navigation';

/**
 * Phase 0 lands on the dashboard. Feature 1.1 replaces this with an auth check that
 * sends signed-out visitors to the login screen and everyone else to their
 * role-appropriate landing page.
 */
export default function HomePage() {
  redirect('/dashboard');
}
