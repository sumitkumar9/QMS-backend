import type { TenantDb } from '../db/tenant.js';

/**
 * What a service needs to act on behalf of a user inside one organization.
 * Built by the `authenticate` middleware (auth module); services take it as their first argument
 * so they never touch `req`/`res` and can't forget the tenant scope:
 *
 *   export async function createCapa(ctx: RequestCtx, input: CreateCapaInput) {
 *     return ctx.db.capa.create({ data: { ...input, createdById: ctx.userId } });
 *   }
 */
export interface RequestCtx {
  requestId: string;
  userId: string;
  organizationId: string;
  /** Effective permissions = union of the member's roles in this organization. */
  permissions: ReadonlySet<string>;
  /** Prisma client scoped to `organizationId` (see src/db/tenant.ts). */
  db: TenantDb;
}
