import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Singleton async handler (architecture.md §4.2).
 *
 * Wraps an async route handler so a rejected promise reaches the centralized error
 * handler instead of hanging the request. Every async controller method goes through
 * this — modules must not write their own wrapper.
 *
 *   router.get('/', asyncHandler(memberController.list));
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
