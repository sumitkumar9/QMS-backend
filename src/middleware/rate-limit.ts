import { rateLimit } from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants.js';
import { ERROR_CODES } from '../core/errors/index.js';

/**
 * Global per-IP limit for the API. In-memory store: fine for a single instance.
 * When running multiple instances, switch to a shared store (e.g. Postgres or Redis).
 * Stricter limiters (login, password reset) are created next to their routes.
 */
export const apiRateLimit = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  limit: RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many requests, please try again later',
        requestId: req.requestId,
      },
    });
  },
});
