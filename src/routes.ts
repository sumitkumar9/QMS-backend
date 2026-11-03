import { Router, type Express } from 'express';
import { API_PREFIX } from './config/constants.js';
import { AppError, ERROR_CODES } from './core/errors/index.js';
import { ok } from './core/response.js';
import { pingDatabase } from './db/prisma.js';
import { apiRateLimit } from './middleware/rate-limit.js';

/**
 * THE single place where routers are mounted. Modules never mount themselves.
 *
 * To add a module (see src/modules/README.md):
 *   import { capaRouter } from './modules/capa/index.js';
 *   apiV1.use('/capas', capaRouter);
 */
export function mountRoutes(app: Express): void {
  // Liveness: process is up. Used by the orchestrator to restart a stuck container.
  app.get('/health', (_req, res) => {
    ok(res, { status: 'ok' });
  });

  // Readiness: dependencies reachable. Used by the load balancer to route traffic.
  app.get('/health/ready', async (_req, res) => {
    try {
      await pingDatabase();
    } catch {
      throw new AppError('Database unavailable', 503, ERROR_CODES.SERVICE_UNAVAILABLE);
    }
    ok(res, { status: 'ready' });
  });

  const apiV1 = Router();
  apiV1.use(apiRateLimit);

  // ── Module routers are registered here ──

  app.use(API_PREFIX, apiV1);
}
