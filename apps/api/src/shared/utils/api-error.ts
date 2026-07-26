/**
 * Operational error carrying an HTTP status.
 *
 * Services throw these; the centralized error handler turns them into the standard
 * response envelope. Anything that is *not* an `ApiError` is treated as an unexpected
 * fault: logged in full, reported to the client as a generic 500.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  /** Field-level validation messages, keyed by field path. */
  readonly details: Record<string, string[]> | undefined;
  readonly isOperational = true;

  constructor(
    statusCode: number,
    message: string,
    code = 'ERROR',
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: Record<string, string[]>): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static validation(details: Record<string, string[]>, message = 'Validation failed'): ApiError {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to do that'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message, 'CONFLICT');
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.'): ApiError {
    return new ApiError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message = 'Something went wrong'): ApiError {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}
