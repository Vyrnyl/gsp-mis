import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../../config/env';
import type { RoleName } from '../constants/roles';

/**
 * Signs and verifies the two JWTs auth issues (architecture.md §8): a short-lived
 * access token and a long-lived, rotated refresh token. Only the BFF and this API
 * ever see a raw token — the BFF stores both in httpOnly cookies and never exposes
 * them to browser JS.
 */
export interface TokenPayload {
  sub: string;
  role: RoleName;
}

export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & TokenPayload;
}

/** Reads the `exp` claim (unix seconds) without a fresh verify call — used to size DB/cookie TTLs. */
export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded?.exp) {
    throw new Error('Token has no exp claim.');
  }
  return new Date(decoded.exp * 1000);
}
