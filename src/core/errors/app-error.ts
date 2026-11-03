import { ERROR_CODES, type ErrorCode } from './error-codes.js';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Base class for every error we throw on purpose. The error handler turns it into
 * `{ error: { code, message, details?, requestId } }` with `statusCode`.
 * 4xx errors are "expected": their message is safe to show to the client.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }

  get isClientError(): boolean {
    return this.statusCode < 500;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, ERROR_CODES.BAD_REQUEST, details);
  }
}

export class ValidationError extends AppError {
  constructor(fieldErrors: FieldError[], message = 'Request validation failed') {
    super(message, 422, ERROR_CODES.VALIDATION_FAILED, { fieldErrors });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, ERROR_CODES.UNAUTHENTICATED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

/** Also used for records that exist in another tenant — never reveal they exist. */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details?: unknown) {
    super(message, 409, ERROR_CODES.CONFLICT, details);
  }
}
