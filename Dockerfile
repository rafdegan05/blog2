# ─── Stage 1: Dependencies ───
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat \
 && corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

# Copy only what pnpm needs to resolve → maximises layer cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate + Next.js build in a single layer
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate && pnpm run build

# ─── Stage 2.5: Prisma CLI (runs in parallel with builder) ───
FROM node:22-alpine AS prisma-cli
WORKDIR /prisma-cli
RUN npm install --no-audit --no-fund \
      prisma@7 tsx @prisma/client@7 @prisma/adapter-pg@7 pg bcryptjs dotenv

# ─── Stage 3: Production runner ───
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Non-root user (single layer)
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Static assets & standalone server
COPY --from=builder --chown=nextjs:nodejs /app/public              ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone    ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static        ./.next/static

# Prisma schema + generated client (needed at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma              ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts    ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated       ./src/generated

# Prisma CLI + seed runtime (isolated to avoid pnpm symlink issues)
COPY --from=prisma-cli /prisma-cli/node_modules                    /app/prisma-cli/node_modules
COPY --from=builder    /app/prisma/seed.ts                         /app/prisma-cli/prisma/seed.ts
COPY --from=builder    /app/src/generated                          /app/prisma-cli/src/generated

# Entrypoint
COPY scripts/start.sh ./start.sh
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh \
 && mkdir -p /app/public/uploads/images /app/public/uploads/audio \
 && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000

CMD ["./start.sh"]
