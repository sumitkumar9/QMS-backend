# syntax=docker/dockerfile:1

# ---- deps: install all dependencies (dev deps needed for prisma generate + tsc) ----
FROM node:26.13-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts

# ---- build: generate Prisma client and compile TypeScript ----
FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npx prisma generate \
 && npm run build \
 && npm prune --omit=dev

# ---- runtime: minimal image, non-root ----
FROM node:26.13-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]

# Migrations run as a separate one-off step BEFORE rolling out a new version, e.g.:
#   docker build --target deps -t qms-api-migrate . && docker run --rm -e DATABASE_URL=... qms-api-migrate npx prisma migrate deploy
