import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TENANT_MODELS } from '../src/db/tenant.js';

/** Every model with an `organizationId` field, read straight from schema.prisma. */
function modelsWithOrganizationId(): string[] {
  const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
  const models = schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm);
  return [...models].flatMap(([, name, body]) =>
    name && body && /^\s*organizationId\s/m.test(body) ? [name] : [],
  );
}

describe('tenant isolation guard', () => {
  it('TENANT_MODELS lists exactly the models that have organizationId', () => {
    expect([...TENANT_MODELS].sort()).toEqual(modelsWithOrganizationId().sort());
  });
});
