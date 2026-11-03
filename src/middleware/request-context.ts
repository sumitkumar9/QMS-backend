import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { runWithContext } from '../core/request-context.js';

const REQUEST_ID_HEADER = 'x-request-id';
const SAFE_REQUEST_ID = /^[\w-]{1,100}$/;

/**
 * Assigns a request id (reusing a well-formed incoming `x-request-id` from the load balancer),
 * echoes it on the response, and opens the AsyncLocalStorage scope for the rest of the request.
 */
export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER);
  const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  runWithContext({ requestId }, next);
};
