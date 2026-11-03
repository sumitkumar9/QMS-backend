import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from '../config/env.js';
import { createLogger } from '../core/logger.js';

const log = createLogger('db.prisma');

/**
 * The single Prisma client for the process. Do not instantiate PrismaClient anywhere else.
 * Tenant-owned data must be accessed through `tenantDb(organizationId)` (src/db/tenant.ts).
 */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  log: [
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('warn', (e) => {
  log.warn({ target: e.target }, e.message);
});
prisma.$on('error', (e) => {
  log.error({ target: e.target }, e.message);
});

export async function pingDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
