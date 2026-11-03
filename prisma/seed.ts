/**
 * Database seed entry point (`npm run db:seed`).
 * Will create system role templates and the permission catalog once those tables exist.
 * Seeds must be idempotent (upsert), so they are safe to re-run in any environment.
 */
import { prisma } from '../src/db/prisma.js';
import { logger } from '../src/core/logger.js';

// Becomes async once there is data to seed.
function main(): void {
  logger.info('Nothing to seed yet');
}

try {
  main();
} catch (err) {
  logger.fatal({ err }, 'Seed failed');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
