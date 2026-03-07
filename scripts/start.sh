#!/bin/sh
set -e

echo "=> Running Prisma db push..."
./node_modules/.bin/prisma db push

echo "=> Starting Next.js..."
exec node server.js
