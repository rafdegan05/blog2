#!/bin/sh
set -e

echo "=> Running Prisma db push..."
NODE_PATH=/app/prisma-cli/node_modules node /app/prisma-cli/node_modules/prisma/build/index.js db push

echo "=> Starting Next.js..."
exec node server.js
