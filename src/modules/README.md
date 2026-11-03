# Modules

One folder per business domain (`capas`, `documents`, `audits`, …). No feature modules exist yet. This file is the template to follow.

## Layout

```
src/modules/capas/
  index.ts              Public surface: export { capasRouter } and the service functions other modules may call
  capas.router.ts       Paths + middleware chain. No logic
  capas.controller.ts   req → service → ok()/created()/paginated(). No DB access
  capas.service.ts      Business rules + data access via ctx.db. No req/res
  capas.schema.ts       Zod schemas (params/query/body) + inferred input types = the API contract
  capas.repository.ts   OPTIONAL: only for complex/reused queries or raw SQL
```

Tests go in `tests/modules/capas/*.test.ts`.

## Example

```ts
// capas.schema.ts
export const CreateCapaSchema = z.object({
  title: text(200),
  type: z.enum(['CORRECTIVE', 'PREVENTIVE']),
  dueDate: z.coerce.date(),
});
export type CreateCapaInput = z.infer<typeof CreateCapaSchema>;

// capas.router.ts
export const capasRouter = Router();
capasRouter.use(authenticate);
capasRouter.post(
  '/',
  requirePermission(PERMISSIONS.CAPA_MANAGE),
  validate({ body: CreateCapaSchema }),
  capasController.create,
);
capasRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.CAPA_READ),
  validate({ params: idParams }),
  capasController.getById,
);

// capas.controller.ts
export async function create(req: Request, res: Response) {
  created(res, await capasService.create(req.ctx!, req.body as CreateCapaInput));
}

// capas.service.ts
export async function create(ctx: RequestCtx, input: CreateCapaInput) {
  return ctx.db.$transaction(async (tx) => {
    const number = await nextNumber(tx, 'CAPA');
    const capa = await tx.capa.create({
      data: { ...input, number, ownerId: ctx.userId, createdById: ctx.userId },
    });
    await writeAudit(tx, ctx, { action: 'capa.created', entityType: 'capa', entityId: capa.id });
    return capa;
  });
}

export async function getById(ctx: RequestCtx, id: string) {
  const capa = await ctx.db.capa.findUnique({ where: { id } }); // tenant scope added automatically
  if (!capa) throw new NotFoundError('CAPA');
  return capa;
}
```

Then register the router once in `src/routes.ts`: `apiV1.use('/capas', capasRouter)`.

## Rules

1. **Other modules import only from `index.ts`.** Never reach into another module's files.
2. **Services get `ctx` first** and use `ctx.db` (tenant-scoped). Only global tables (users, sessions) use the raw `prisma` client.
3. **Every route has a permission check and validation.**
4. **Workflow changes are explicit actions** (`POST /:id/close`) that check the current status in the service.
5. **Changes to quality data write an audit-log entry** in the same transaction.
6. **New tenant-owned model?** Add it to `TENANT_MODELS` in `src/db/tenant.ts` (a test enforces this).
7. **Every module needs a tenant-isolation test** (org B gets 404 for org A's record).
