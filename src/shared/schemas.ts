import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

/** Reusable Zod building blocks. Module-specific schemas live in `<module>.schema.ts`. */

export const uuid = z.uuid();

export const idParams = z.object({ id: uuid });

/** Trimmed, non-empty text with a max length. */
export const text = (max = 255) => z.string().trim().min(1).max(max);

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

/**
 * `sort=-createdAt` → `{ field: 'createdAt', direction: 'desc' }`.
 * Pass the whitelisted sortable fields of the resource.
 */
export const sortQuery = <const F extends readonly [string, ...string[]]>(fields: F, defaultSort: string) =>
  z
    .string()
    .default(defaultSort)
    .transform((value, ctx) => {
      const direction = value.startsWith('-') ? ('desc' as const) : ('asc' as const);
      const field = value.replace(/^-/, '');
      if (!isSortField(fields, field)) {
        ctx.addIssue({ code: 'custom', message: `Sort must be one of: ${fields.join(', ')}` });
        return z.NEVER;
      }
      return { field, direction };
    });

function isSortField<F extends readonly string[]>(fields: F, value: string): value is F[number] {
  return fields.includes(value);
}

export type PaginationQuery = z.infer<typeof paginationQuery>;
