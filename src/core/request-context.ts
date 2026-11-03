import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request values available anywhere in the call chain (logger, services, Prisma hooks)
 * without passing them through every function. Set once per request by requestContext middleware;
 * auth middleware fills in userId / organizationId later.
 */
export interface RequestStore {
  requestId: string;
  userId?: string;
  organizationId?: string;
}

const storage = new AsyncLocalStorage<RequestStore>();

export function runWithContext<T>(store: RequestStore, fn: () => T): T {
  return storage.run(store, fn);
}

export function getContext(): RequestStore | undefined {
  return storage.getStore();
}

/** Add values learned mid-request (e.g. after authentication). */
export function bindContext(values: Partial<RequestStore>): void {
  const store = storage.getStore();
  if (store) Object.assign(store, values);
}
