import { redirect } from 'next/navigation';

/**
 * `middleware.ts` (feature 1.1) bounces signed-out visitors to `/login` before this
 * redirect would even resolve. Role-differentiated landing content is feature 1.5 —
 * every role lands on this same `/dashboard` placeholder for now.
 */
export default function HomePage() {
  redirect('/dashboard');
}
