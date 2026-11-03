import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from './prisma.js';

/**
 * Models that belong to a tenant (have an `organizationId` column).
 * ⚠️ Every new tenant-owned model MUST be added here — tests/tenant.test.ts checks this list
 * against the schema so a missing entry fails CI.
 */
export const TENANT_MODELS: ReadonlySet<Prisma.ModelName> = new Set<Prisma.ModelName>(['Membership']);

/** Operations whose `where` gets `organizationId` appended. */
const WHERE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
  'upsert',
]);

type Args = Record<string, unknown>;

const withTenant = (data: unknown, organizationId: string): Args => ({ ...(data as Args), organizationId });

/**
 * Returns a Prisma client that automatically scopes tenant models to one organization:
 *  - reads / updates / deletes: `organizationId` is added to `where`
 *    (so an id from another tenant simply isn't found → 404)
 *  - creates: `organizationId` is set on the data (any value sent by the caller is overwritten)
 *  - updates may not change `organizationId`
 *
 * Limits (by design, keep queries simple): nested writes and `include`d relations are not
 * rewritten — related tenant data is reached through an already-scoped parent. Raw SQL is not
 * scoped; always filter by organization_id yourself.
 *
 * Usage: services receive it as `ctx.db`; they should never import `prisma` for tenant data.
 */
export function tenantDb(organizationId: string) {
  return prisma.$extends({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);

          const scoped = { ...(args as Args) };

          if (WHERE_OPERATIONS.has(operation)) {
            scoped.where = withTenant(scoped.where, organizationId);
          }

          switch (operation) {
            case 'create':
              scoped.data = withTenant(scoped.data, organizationId);
              break;
            case 'createMany':
            case 'createManyAndReturn':
              scoped.data = Array.isArray(scoped.data)
                ? scoped.data.map((row) => withTenant(row, organizationId))
                : withTenant(scoped.data, organizationId);
              break;
            case 'upsert':
              scoped.create = withTenant(scoped.create, organizationId);
              assertNoTenantChange(scoped.update);
              break;
            case 'update':
            case 'updateMany':
            case 'updateManyAndReturn':
              assertNoTenantChange(scoped.data);
              break;
          }

          return query(scoped);
        },
      },
    },
  });
}

function assertNoTenantChange(data: unknown): void {
  if (data && typeof data === 'object' && ('organizationId' in data || 'organization' in data)) {
    throw new Error('Changing the organization of a tenant-owned record is not allowed');
  }
}

export type TenantDb = ReturnType<typeof tenantDb>;
