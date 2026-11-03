import type { RequestCtx } from '../core/request-ctx.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by requestContext middleware for every request. */
      requestId: string;
      /**
       * Authenticated tenant context — set by the `authenticate` middleware (auth module).
       * Pass it to services: `capaService.create(req.ctx, req.body)`.
       */
      ctx?: RequestCtx;
    }
  }
}

export {};
