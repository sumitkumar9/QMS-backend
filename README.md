# QMS API

A multi-tenant Quality Management System backend. It is a modular monolith built with **Node 26 LTS, Express 5, TypeScript 6, PostgreSQL 18 and Prisma 7**.

- Architecture and conventions: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Database schema (proposal under review): [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- How to build a module: [src/modules/README.md](src/modules/README.md)

## Quick start

```bash
nvm use                     # Node 26.13 (from .nvmrc)
npm install                 # also runs `prisma generate`
cp .env.example .env
docker compose up -d        # PostgreSQL 18 on :5432 (databases qms + qms_test)
npm run db:migrate          # apply migrations (first one: npm run db:migrate -- --name init)
npm run dev                 # http://localhost:3000/health/ready
```

## Scripts

| Script                                            | What it does                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `dev`                                             | Run with tsx in watch mode (loads `.env`)                             |
| `build` / `start`                                 | Compile to `dist/` / run the compiled server                          |
| `check`                                           | typecheck + lint + format check + tests. Run before every PR          |
| `test`, `test:watch`, `test:coverage`             | Vitest                                                                |
| `lint`, `lint:fix`, `format`                      | ESLint / Prettier                                                     |
| `db:migrate:create -- --name x`                   | Create a migration **without applying it**, so you can review the SQL |
| `db:migrate`                                      | Create (if needed) and apply migrations in development                |
| `db:deploy`                                       | Apply pending migrations (CI / production)                            |
| `db:seed`, `db:studio`, `db:reset`, `db:generate` | Prisma helpers                                                        |

## Endpoints available now

| Method | Path            | Purpose                              |
| ------ | --------------- | ------------------------------------ |
| GET    | `/health`       | Liveness: the process is up          |
| GET    | `/health/ready` | Readiness: the database is reachable |

Feature modules mount under `/api/v1` (see `src/routes.ts`).
