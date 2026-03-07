#!/bin/sh
set -e

echo "=> Running Prisma db push..."
node /app/node_modules/prisma/build/index.js db push

echo "=> Starting Next.js..."
exec node server.js
