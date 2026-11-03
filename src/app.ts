import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { BODY_LIMIT } from './config/constants.js';
import { errorHandler } from './middleware/error-handler.js';
import { httpLogger } from './middleware/http-logger.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestContext } from './middleware/request-context.js';
import { mountRoutes } from './routes.js';

/**
 * Builds the Express app without listening, so tests can use it with supertest.
 * Middleware order is deliberate — read top to bottom before changing it.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Needed for correct req.ip (rate limiting, audit logs) behind a load balancer.
  app.set('trust proxy', env.TRUST_PROXY);

  // 1. Request id + async context first, so everything after (including errors) is correlated.
  app.use(requestContext);
  app.use(httpLogger);

  // 2. Security headers and CORS (browser origins explicitly allow-listed; cookies allowed).
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      maxAge: 7200,
      exposedHeaders: ['x-request-id'],
    }),
  );

  // 3. Body parsing: JSON only. urlencoded is intentionally not enabled (reduces CSRF surface).
  //    File uploads will use multer on specific routes.
  app.use(express.json({ limit: BODY_LIMIT }));

  // 4. Routes (health + /api/v1). Rate limiting is applied inside mountRoutes for /api only.
  mountRoutes(app);

  // 5. Fallbacks — must stay last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
