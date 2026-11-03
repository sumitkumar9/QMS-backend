import { env } from './config/env.js';
import { SHUTDOWN_TIMEOUT_MS } from './config/constants.js';
import { createApp } from './app.js';
import { logger } from './core/logger.js';
import { pingDatabase, prisma } from './db/prisma.js';

/**
 * Process entry point: validate env (on import) → check DB → listen → graceful shutdown.
 */
async function main(): Promise<void> {
  try {
    await pingDatabase();
  } catch (err) {
    logger.fatal({ err }, 'Cannot connect to the database — check DATABASE_URL');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'QMS API listening');
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    // Stop accepting connections, let in-flight requests finish, then release the DB pool.
    server.close(() => {
      void prisma.$disconnect().finally(() => {
        logger.info('Shutdown complete');
        process.exit(0);
      });
    });
    server.closeIdleConnections();
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

await main();
