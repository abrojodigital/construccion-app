#!/bin/sh
set -e

echo ""
echo "============================================"
echo "  API Container - Initialization"
echo "============================================"
echo ""

# ------------------------------------------
# 1. Wait for PostgreSQL to be ready
# ------------------------------------------
echo "Waiting for PostgreSQL..."

MAX_RETRIES=30
RETRY_COUNT=0

# Extract host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}

echo "   Connecting to ${DB_HOST}:${DB_PORT}..."

# Brief pause to allow Docker's internal DNS to resolve container hostnames
sleep 2

# Use node for TCP check (works on any Alpine image without extra packages)
until node -e "const s=require('net').connect(${DB_PORT},'${DB_HOST}',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));s.setTimeout(5000,()=>{s.destroy();process.exit(1)})" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "ERROR: PostgreSQL not available at ${DB_HOST}:${DB_PORT} after ${MAX_RETRIES} attempts. Exiting."
    exit 1
  fi
  echo "   Attempt ${RETRY_COUNT}/${MAX_RETRIES} - PostgreSQL not ready yet..."
  sleep 2
done

echo "PostgreSQL is ready!"
echo ""

# ------------------------------------------
# 2. Run database migrations
# ------------------------------------------
RUN_SEED_VAL="${RUN_SEED:-true}"

echo "Synchronizing database schema..."
cd /app/packages/database
if [ "$RUN_SEED_VAL" = "force" ]; then
  echo "Force reset: dropping and recreating database schema..."
  npx prisma db push --force-reset --skip-generate
else
  npx prisma db push --accept-data-loss --skip-generate
fi
echo "Database schema synchronized!"
echo ""

# ------------------------------------------
# 3. Seed database (only if empty and enabled)
# ------------------------------------------

if [ "$RUN_SEED_VAL" = "force" ]; then
  echo "Force re-seed requested..."
  npx tsx prisma/seed.ts
  echo ""
  echo "Re-seed completed!"
elif [ "$RUN_SEED_VAL" = "true" ]; then
  # Check if database already has data (check organizations table)
  HAS_DATA=$(node -e "
var PrismaClient = require('@prisma/client').PrismaClient;
var p = new PrismaClient();
p.organization.count().then(function(c) {
  p.\$disconnect().then(function() {
    process.stdout.write(c > 0 ? 'yes' : 'no');
    process.exit(0);
  });
}).catch(function() {
  p.\$disconnect().catch(function(){});
  process.stdout.write('no');
  process.exit(0);
});
" 2>/dev/null)
  HAS_DATA=${HAS_DATA:-no}

  if [ "$HAS_DATA" = "no" ]; then
    echo "Database is empty. Running seed with demo data..."
    npx tsx prisma/seed.ts
    echo ""
    echo "Seed completed!"
  else
    echo "Database already has data. Skipping seed."
    echo "   (Set RUN_SEED=force to re-seed, or RUN_SEED=false to disable)"
  fi
else
  echo "Seeding disabled (RUN_SEED=false)"
fi

echo ""

# ------------------------------------------
# 4. Start the API server
# ------------------------------------------
echo "Starting API server..."
cd /app/apps/api
exec node dist/main.js
