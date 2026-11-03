import { pino, type Logger } from 'pino';
import { env, isProduction } from '../config/env.js';
import { getContext } from './request-context.js';

/**
 * Root logger. JSON to stdout in production (the platform collects it); pretty in development.
 * Every line automatically carries requestId / userId / organizationId from the request context.
 */
export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'qms-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin: () => ({ ...getContext() }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  ...(isProduction || env.NODE_ENV === 'test'
    ? {}
    : {
        transport: { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss.l' } },
      }),
});

/** Use one per file: `const log = createLogger('capa.service')`. */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}
