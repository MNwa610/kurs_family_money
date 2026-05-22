#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding demo data..."
npx prisma db seed

echo "Starting API server..."
exec node src/server.js
