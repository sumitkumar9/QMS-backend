import type { ErrorRequestHandler } from 'express';
import { AppError, ERROR_CODES } from '../core/errors/index.js';
import { createLogger } from '../core/logger.js';
import { Prisma } from '../generated/prisma/client.js';

const log = createLogger('http.error');

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

/** Maps known library errors to AppError. Anything unknown becomes a 500. */
function normalize(err: unknown): AppError {
  if (err instanceof AppError) return err;

  // Body parser errors (malformed JSON, payload too large) carry a `status` and `type`.
  if (typeof err === 'object' && err !== null && 'type' in err && 'status' in err) {
    const { type, status } = err as { type: string; status: number };
    if (type === 'entity.parse.failed')
      return new AppError('Malformed JSON body', 400, ERROR_CODES.BAD_REQUEST);
    if (type === 'entity.too.large')
      return new AppError('Request body too large', 413, ERROR_CODES.PAYLOAD_TOO_LARGE);
    if (status >= 400 && status < 500) return new AppError('Bad request', status, ERROR_CODES.BAD_REQUEST);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return new AppError('Resource already exists', 409, ERROR_CODES.CONFLICT);
    if (err.code === 'P2025') return new AppError('Resource not found', 404, ERROR_CODES.NOT_FOUND);
  }

  return new AppError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
}

/**
 * The only place that formats error responses: `{ error: { code, message, details?, requestId } }`.
 * 5xx responses never expose internal messages or stack traces; the real error is logged instead.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = normalize(err);

  if (appError.isClientError) {
    log.debug({ code: appError.code, details: appError.details }, appError.message);
  } else {
    log.error({ err }, 'Unhandled error');
  }

  const body: ErrorBody = { code: appError.code, message: appError.message, requestId: req.requestId };
  if (appError.isClientError && appError.details !== undefined) body.details = appError.details;

  res.status(appError.statusCode).json({ error: body });
};
