import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// No database needed for these tests: the readiness probe's DB ping is mocked.
vi.mock('../src/db/prisma.js', () => ({
  prisma: {},
  pingDatabase: vi.fn(),
}));

const { createApp } = await import('../src/app.js');
const { pingDatabase } = await import('../src/db/prisma.js');

const app = createApp();

describe('health', () => {
  beforeEach(() => {
    vi.mocked(pingDatabase).mockReset();
  });

  it('GET /health → 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('GET /health/ready → 200 when the database answers', async () => {
    vi.mocked(pingDatabase).mockResolvedValue();
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ready' } });
  });

  it('GET /health/ready → 503 when the database is down', async () => {
    vi.mocked(pingDatabase).mockRejectedValue(new Error('connection refused'));
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

describe('request id', () => {
  it('generates one and echoes it in the header and error body', async () => {
    const res = await request(app).get('/nope');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('reuses a well-formed incoming x-request-id', async () => {
    const res = await request(app).get('/health').set('x-request-id', 'lb-abc-123');
    expect(res.headers['x-request-id']).toBe('lb-abc-123');
  });
});

describe('error envelope', () => {
  it('unknown route → 404 ROUTE_NOT_FOUND', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
  });

  it('malformed JSON → 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post('/api/v1/anything')
      .set('content-type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides x-powered-by', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows only configured CORS origins', async () => {
    const allowed = await request(app).get('/health').set('origin', 'http://localhost:3001');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3001');

    const blocked = await request(app).get('/health').set('origin', 'https://evil.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
