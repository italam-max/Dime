# Dime — imagen de producción (Next.js 16 + Prisma + PostgreSQL).
# Multi-stage: build con todas las deps, runtime solo con deps de producción.
# Debian slim + openssl por compatibilidad de los engines de Prisma.

# ---- Base ----
FROM node:20-slim AS base
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Dependencias completas (para compilar) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL ficticia: el build no se conecta, pero Prisma la espera presente.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN npx prisma generate
RUN npm run build

# ---- Dependencias de producción (runtime) ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# ---- Runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
# Metadatos del build (opcionales): permiten mostrar el commit desplegado.
ARG APP_BUILD_SHA=""
ARG APP_BUILD_TIME=""
ENV APP_BUILD_SHA=$APP_BUILD_SHA
ENV APP_BUILD_TIME=$APP_BUILD_TIME
RUN groupadd -r nodejs && useradd -r -g nodejs -m nextjs
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY package.json next.config.ts ./
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
# Aplica migraciones (prisma migrate deploy) y arranca Next.
ENTRYPOINT ["./docker-entrypoint.sh"]
