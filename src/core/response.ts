import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Success envelope: `{ data, meta? }`. Errors use `{ error: {...} }` (see error-handler). */
export function ok(res: Response, data: unknown, meta?: Record<string, unknown>): void {
  res.status(200).json(meta ? { data, meta } : { data });
}

export function created(res: Response, data: unknown): void {
  res.status(201).json({ data });
}

export function noContent(res: Response): void {
  res.status(204).end();
}

export function paginated(
  res: Response,
  items: unknown[],
  { page, limit, total }: { page: number; limit: number; total: number },
): void {
  const meta: PaginationMeta = { page, limit, total, totalPages: Math.ceil(total / limit) };
  res.status(200).json({ data: items, meta });
}
