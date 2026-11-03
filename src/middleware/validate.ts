import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { ValidationError, type FieldError } from '../core/errors/index.js';

interface RequestSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

/**
 * Validates and replaces `req.body`, `req.query` and `req.params` with the parsed values
 * (coerced, defaults applied, unknown keys stripped). Fails with 422 VALIDATION_FAILED and
 * per-field messages.
 *
 *   router.post('/', validate({ body: CreateCapaSchema }), controller.create)
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const fieldErrors: FieldError[] = [];

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          fieldErrors.push({ field: [part, ...issue.path.map(String)].join('.'), message: issue.message });
        }
        continue;
      }

      if (part === 'body') {
        req.body = result.data;
      } else {
        // Express 5: req.query / req.params are getters — redefine with the parsed value.
        // params are merged so a child router keeps its parent's params.
        const value = part === 'params' ? { ...req.params, ...(result.data as object) } : result.data;
        Object.defineProperty(req, part, { value, writable: true, configurable: true, enumerable: true });
      }
    }

    if (fieldErrors.length > 0) {
      next(new ValidationError(fieldErrors));
      return;
    }
    next();
  };
}
