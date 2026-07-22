import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ACCESS_TOKEN_COOKIE } from '@/features/auth/constants';

const PUBLIC_PATHS = ['/login'];

/**
 * Cookie-presence gate for the (app) route group (feature 1.1's "protected-route
 * redirect"). This checks presence only, not signature/expiry — real enforcement
 * happens API-side via `requireAuth` once a protected endpoint exists (feature 1.2+).
 * Good enough to get signed-out visitors to `/login` and signed-in ones off it.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|logo.jpg).*)'],
};
