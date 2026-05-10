###############################################################################
# ThreatPulse Intel — Docker Build
# Multi-stage: deps → build → production (standalone)
###############################################################################

# ── Base ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ── Install dependencies ────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copy the real package.json (follows symlink) and lockfile
COPY nextjs_space/package.json ./package.json
# Copy lockfile if it exists (may be a symlink too)
COPY nextjs_space/yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false 2>/dev/null || yarn install --production=false

# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY nextjs_space/ .

# Fix Prisma output path for Docker context (schema references absolute dev path)
RUN sed -i 's|output.*=.*"/home/ubuntu.*"|output = "./node_modules/.prisma/client"|' prisma/schema.prisma

# Generate Prisma client
RUN npx prisma generate

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_OUTPUT_MODE=standalone
# Provide dummy vars needed at build time (overridden at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXTAUTH_SECRET="build-time-placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"

RUN yarn build

# ── Production ──────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma assets for runtime migrations + seeding
RUN mkdir -p /app/prisma-tools/node_modules
COPY --from=builder /app/prisma /app/prisma-tools/prisma
COPY --from=builder /app/scripts /app/prisma-tools/scripts
COPY --from=builder /app/tsconfig.json /app/prisma-tools/tsconfig.json
COPY --from=builder /app/package.json /app/prisma-tools/package.json
COPY --from=builder /app/node_modules/.prisma /app/prisma-tools/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/prisma-tools/node_modules/@prisma
COPY --from=builder /app/node_modules/prisma /app/prisma-tools/node_modules/prisma

# tsx and its dependencies for running seed.ts
COPY --from=builder /app/node_modules/tsx /app/prisma-tools/node_modules/tsx
COPY --from=builder /app/node_modules/esbuild /app/prisma-tools/node_modules/esbuild
COPY --from=builder /app/node_modules/get-tsconfig /app/prisma-tools/node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps /app/prisma-tools/node_modules/resolve-pkg-maps
COPY --from=builder /app/node_modules/bcryptjs /app/prisma-tools/node_modules/bcryptjs

# Install pg driver for the entrypoint database readiness check
RUN cd /app/prisma-tools && npm install --no-save pg 2>/dev/null || true

# Create .bin links for npx to find prisma and tsx
RUN mkdir -p /app/prisma-tools/node_modules/.bin && \
    ln -sf ../prisma/build/index.js /app/prisma-tools/node_modules/.bin/prisma && \
    ln -sf ../tsx/dist/cli.mjs /app/prisma-tools/node_modules/.bin/tsx

# Set Prisma schema path for CLI commands
ENV PRISMA_SCHEMA_PATH=/app/prisma-tools/prisma/schema.prisma

# Copy entrypoint script
COPY docker/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# The entrypoint needs write access (prisma needs to write temp files)
RUN chown -R nextjs:nodejs /app/prisma-tools

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]