import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env automatically. Use Node's built-in loader (no dotenv).
try {
  process.loadEnvFile();
} catch {
  // No .env file (CI / containers inject real env vars).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Optional here so `prisma generate` (run by `npm install`) works without a database configured;
  // migrate/studio commands will report a clear error if DATABASE_URL is missing.
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
