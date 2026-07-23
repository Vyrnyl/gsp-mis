import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ACCESS_TOKEN_COOKIE } from '@/features/auth/constants';
import type { AuthRoleId } from '@/features/auth/types';
import { getRequiredPermissionForPath, roleHasPermission } from '@/shared/constants/roles';

const PUBLIC_PATHS = ['/login'];

/**
 * Reads the `role` claim out of the access token's payload without verifying the
 * signature — edge runtime has no `Buffer`/`jsonwebtoken`, and this is a UX-level
 * redirect only. A tampered or expired token just fails the permission check (or
 * decodes to nothing, which fails open here) and the *real* rejection happens
 * API-side once the route the user lands on actually calls a protected endpoint.
 */
function decodeRole(token: string): AuthRoleId | null {
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) return null;

  try {
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { role?: AuthRoleId };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

/**
 * Cookie-presence gate for the (app) route group (feature 1.1's "protected-route
 * redirect"), plus feature 1.2's role-based route guard. This checks presence and
 * the token's own unverified role claim, not a real signature/expiry check — real
 * enforcement happens API-side via `requireAuth`/`requireRole` once each feature's
 * own protected endpoints exist. Good enough to get signed-out visitors to `/login`,
 * signed-in ones off it, and unauthorized roles off routes they can't use.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const isAuthenticated = Boolean(accessToken);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (accessToken && !isPublicPath) {
    const requiredPermission = getRequiredPermissionForPath(pathname);
    const role = requiredPermission ? decodeRole(accessToken) : null;

    if (requiredPermission && role && !roleHasPermission(role, requiredPermission)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|logo.jpg).*)'],
};
