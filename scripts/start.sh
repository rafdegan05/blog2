#!/bin/sh
set -e

echo "=> Running Prisma db push..."
NODE_PATH=/app/prisma-cli/node_modules node /app/prisma-cli/node_modules/prisma/build/index.js db push

echo "=> Migrating legacy transcripts..."
cd /app/prisma-cli && node node_modules/.bin/tsx prisma/migrate-transcripts.ts && cd /app
echo "=> Transcript migration complete."

echo "=> Running Prisma seed..."
cd /app/prisma-cli && node node_modules/.bin/tsx prisma/seed.ts && cd /app
echo "=> Seed complete."

echo "=> Starting Next.js..."
exec node server.js
