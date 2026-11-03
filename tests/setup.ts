// Runs before every test file — must set env before src/config/env.ts is imported (it parses once).
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL ??= 'postgresql://qms:qms@localhost:5432/qms_test';
process.env.CORS_ORIGINS = 'http://localhost:3001';
