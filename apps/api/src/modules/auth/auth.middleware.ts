import type { NextFunction, Request, Response } from 'express';

import { ApiError } from '../../shared/utils/api-error';
import { verifyAccessToken } from '../../shared/utils/jwt';
import type { RoleName } from '../../shared/constants/roles';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: RoleName };
    }
  }
}

/**
 * Verifies the `Authorization: Bearer <accessToken>` header and attaches `req.user`.
 * Not applied anywhere yet — every protected route wires this in starting with
 * feature 1.2, once there is a route worth protecting.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(ApiError.unauthorized('Authentication required.'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired access token.'));
  }
}

/** Composes with `requireAuth` to gate a route to specific roles. */
export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}
