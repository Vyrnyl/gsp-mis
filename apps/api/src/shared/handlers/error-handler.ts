import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { IS_PRODUCTION, IS_TEST } from '../../config/env';
import { ApiError } from '../utils/api-error';
import { sendError } from '../utils/api-response';

/** Turn a ZodError into the `{ field: [messages] }` shape the envelope uses. */
function formatZodIssues(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    details[key] = [...(details[key] ?? []), issue.message];
  }
  return details;
}

/** 404 for anything no route matched. Mount after all routers, before the error handler. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
};

/**
 * Centralized error handler (architecture.md §4.2, code-standards.md §6.5).
 *
 * The single place that formats an HTTP error response. Errors are never swallowed:
 * anything that is not an operational `ApiError` is logged with its stack and reported
 * as a generic 500, so internals never leak to the client.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendError(res, 422, 'VALIDATION_ERROR', 'Validation failed', formatZodIssues(error));
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.['target'] as string[] | undefined)?.join(', ') ?? 'field';
      sendError(res, 409, 'CONFLICT', `A record with that ${target} already exists`);
      return;
    }
    if (error.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Resource not found');
      return;
    }
  }

  // Unexpected — log it in full, tell the client nothing specific.
  if (!IS_TEST) {
    console.error('[unhandled error]', error);
  }

  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    IS_PRODUCTION ? 'Something went wrong' : String((error as Error)?.message ?? error),
  );
};
