import type { Response } from 'express';

/**
 * The one response envelope every endpoint uses (architecture.md §7).
 *
 * Success: `{ success: true, data, meta? }`
 * Failure: `{ success: false, error: { code, message, details? } }`
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
): Response<SuccessBody<T>> {
  const body: SuccessBody<T> = meta ? { success: true, data, meta } : { success: true, data };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
): Response<ErrorBody> {
  const body: ErrorBody = {
    success: false,
    error: details ? { code, message, details } : { code, message },
  };
  return res.status(statusCode).json(body);
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}
