# ─── Stage 1: Dependencies ───
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ─── Stage 2.5: Prisma CLI + Seed runtime ───
FROM node:22-alpine AS prisma-cli
WORKDIR /prisma-cli
RUN npm install prisma tsx @prisma/client @prisma/adapter-pg pg bcryptjs dotenv

# ─── Stage 3: Production ───
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

# Copy prisma CLI with all deps to isolated directory (pnpm's symlink structure doesn't survive COPY)
COPY --from=prisma-cli /prisma-cli/node_modules /app/prisma-cli/node_modules

# Copy seed script + generated client into prisma-cli dir so module resolution works
COPY --from=builder /app/prisma/seed.ts /app/prisma-cli/prisma/seed.ts
COPY --from=builder /app/src/generated  /app/prisma-cli/src/generated

COPY scripts/start.sh ./start.sh
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh

# Create upload directories with correct ownership before switching user
RUN mkdir -p /app/public/uploads/images /app/public/uploads/audio \
    && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
