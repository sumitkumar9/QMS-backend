import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { NotFoundError } from '../src/core/errors/index.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { requestContext } from '../src/middleware/request-context.js';
import { validate } from '../src/middleware/validate.js';
import { idParams, paginationQuery, sortQuery } from '../src/shared/schemas.js';

/** A throwaway app that exercises the shared middleware the way module routers will. */
function buildTestApp() {
  const app = express();
  app.use(requestContext);
  app.use(express.json());

  app.post(
    '/items/:id',
    validate({
      params: idParams,
      query: paginationQuery.extend({ sort: sortQuery(['createdAt', 'title'], '-createdAt') }),
      body: z.object({ title: z.string().min(3) }),
    }),
    (req, res) => {
      res.json({ params: req.params, query: req.query, body: req.body as unknown });
    },
  );
  app.get('/missing', () => {
    throw new NotFoundError('CAPA');
  });
  app.get('/boom', () => {
    throw new Error('db password is hunter2');
  });

  app.use(errorHandler);
  return app;
}

const app = buildTestApp();
const ID = '0190f5d2-7b1a-7c3e-9d4f-1a2b3c4d5e6f';

describe('validate()', () => {
  it('replaces params/query/body with parsed values (coercion + defaults + stripping)', async () => {
    const res = await request(app).post(`/items/${ID}?page=2`).send({ title: 'Valid', extra: 'x' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      params: { id: ID },
      query: { page: 2, limit: 20, sort: { field: 'createdAt', direction: 'desc' } },
      body: { title: 'Valid' },
    });
  });

  it('collects every field error into one 422 response', async () => {
    const res = await request(app).post('/items/not-a-uuid?limit=500&sort=password').send({ title: 'x' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const fields = (res.body.error.details.fieldErrors as { field: string }[]).map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['params.id', 'query.limit', 'query.sort', 'body.title']));
  });
});

describe('errorHandler', () => {
  it('returns AppError status, code and message', async () => {
    const res = await request(app).get('/missing');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'CAPA not found' });
  });

  it('hides internal error details behind a generic 500', async () => {
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatchObject({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    expect(res.body.error.stack).toBeUndefined();
  });
});
