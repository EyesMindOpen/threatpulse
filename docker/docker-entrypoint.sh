#!/bin/sh
set -e

echo "=============================================="
echo "       ThreatPulse Intel -- Starting          "
echo "=============================================="

# Extract host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

# Wait for PostgreSQL to be ready using simple TCP check (no extra modules needed)
echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
RETRIES=30
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "ERROR: Could not connect to database after 60s. Exiting."
    exit 1
  fi
  echo "   Database not ready yet, retrying in 2s... ($RETRIES attempts left)"
  sleep 2
done
echo "Database is ready"

# Run Prisma schema push (creates/updates tables)
echo "Pushing database schema..."
cd /app/prisma-tools
npx prisma db push --schema=./prisma/schema.prisma --skip-generate 2>&1 || {
  echo "Schema push failed, retrying with accept-data-loss..."
  npx prisma db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss 2>&1
}
echo "Database schema is up to date"

# Seed the database (only if no users exist yet)
echo "Checking if seed data exists..."
SEED_CHECK=$(cd /app/prisma-tools && NODE_PATH=/app/prisma-tools/node_modules node -e "
const { PrismaClient } = require('.prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); return p.\$disconnect(); }).catch(() => { console.log('0'); return p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$SEED_CHECK" = "0" ] || [ -z "$SEED_CHECK" ]; then
  echo "Seeding database with demo data..."
  cd /app/prisma-tools
  NODE_PATH=/app/prisma-tools/node_modules npx tsx scripts/seed.ts 2>&1
  echo "Database seeded successfully"
  echo ""
  echo "   Demo accounts created:"
  echo "   Admin:   admin@threatpulse.com / admin123!"
  echo "   Analyst: analyst@threatpulse.com / analyst123!"
else
  echo "Database already has $SEED_CHECK user(s), skipping seed"
fi

# Start the Next.js server
echo ""
echo "Starting ThreatPulse Intel on port ${PORT:-3000}"
echo "   URL: ${NEXTAUTH_URL:-http://localhost:3000}"
echo ""
cd /app
exec node server.js