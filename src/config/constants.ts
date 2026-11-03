export const API_PREFIX = '/api/v1';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const BODY_LIMIT = '1mb';

export const RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 300,
} as const;

/** Grace period for in-flight requests on SIGTERM before forcing exit. */
export const SHUTDOWN_TIMEOUT_MS = 10_000;
