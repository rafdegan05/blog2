# ─── Stage 1: Dependencies ───
FROM node:22-slim AS deps
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

# Copy only what pnpm needs to resolve → maximises layer cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───
FROM node:22-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate + Next.js build in a single layer
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate && pnpm run build

# Extract onnxruntime shared library to a known path for the runner stage
RUN mkdir -p /tmp/onnxrt \
 && find node_modules/.pnpm -name 'libonnxruntime.so*' -exec cp -L {} /tmp/onnxrt/ \; 2>/dev/null || true

# ─── Stage 2.5: Prisma CLI (runs in parallel with builder) ───
FROM node:22-slim AS prisma-cli
WORKDIR /prisma-cli
RUN npm install --no-audit --no-fund \
      prisma@7 tsx @prisma/client@7 @prisma/adapter-pg@7 pg bcryptjs dotenv

# ─── Stage 3: Production runner ───
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# ffmpeg (needed for audio transcription)
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# Static assets & standalone server
COPY --from=builder --chown=nextjs:nodejs /app/public              ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone    ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static        ./.next/static

# onnxruntime shared library (needed at runtime by onnxruntime_binding.node)
COPY --from=builder /tmp/onnxrt/ /usr/lib/

# Prisma schema + generated client (needed at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma              ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts    ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated       ./src/generated

# Prisma CLI + seed runtime (isolated to avoid pnpm symlink issues)
COPY --from=prisma-cli --chown=nextjs:nodejs /prisma-cli/node_modules  /app/prisma-cli/node_modules
COPY --from=builder    --chown=nextjs:nodejs /app/prisma/seed.ts       /app/prisma-cli/prisma/seed.ts
COPY --from=builder    --chown=nextjs:nodejs /app/prisma/migrate-transcripts.ts /app/prisma-cli/prisma/migrate-transcripts.ts
COPY --from=builder    --chown=nextjs:nodejs /app/src/generated        /app/prisma-cli/src/generated

# Entrypoint
COPY scripts/start.sh ./start.sh
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh \
 && mkdir -p /app/public/uploads/images /app/public/uploads/audio \
 && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000

CMD ["./start.sh"]
