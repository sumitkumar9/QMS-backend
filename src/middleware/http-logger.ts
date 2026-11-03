import type { Request } from 'express';
import { pinoHttp } from 'pino-http';
import { createLogger } from '../core/logger.js';

/** One "request completed" line per request with method, url, status and duration. */
export const httpLogger = pinoHttp({
  logger: createLogger('http'),
  // Reuse our request id (set by requestContext, which runs first).
  genReqId: (req) => (req as Request).requestId,
  // requestId already comes from the request context mixin.
  quietReqLogger: true,
  autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
});
