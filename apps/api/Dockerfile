# =============================================
# API Dockerfile - Multi-stage build
# With automatic migration and seed support
# =============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install dependencies (including dev for seed/migrations)
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/typescript-config ./packages/typescript-config
COPY apps/api ./apps/api
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Generate Prisma client
RUN cd packages/database && pnpm prisma generate

# Build database package (compile TS to JS for production)
# Create a build-specific tsconfig that only includes src (excludes prisma/seed.ts)
RUN cd packages/database && \
    node -e "const fs=require('fs'); const cfg=JSON.parse(fs.readFileSync('tsconfig.json','utf8')); cfg.include=['src/**/*']; fs.writeFileSync('tsconfig.build.json',JSON.stringify(cfg,null,2));" && \
    npx tsc -p tsconfig.build.json

# Build shared package
RUN cd packages/shared && pnpm build

# Build API
RUN cd apps/api && pnpm build

# Patch workspace package.json files to point to compiled JS (not TS source)
RUN node -e "\
  const fs = require('fs'); \
  function patch(file, exports) { \
    const pkg = JSON.parse(fs.readFileSync(file,'utf8')); \
    pkg.main = './dist/index.js'; \
    pkg.types = './dist/index.d.ts'; \
    pkg.exports = exports; \
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2)); \
  } \
  patch('packages/database/package.json', { '.': { types: './dist/index.d.ts', default: './dist/index.js' } }); \
  patch('packages/shared/package.json', { \
    '.': { types: './dist/index.d.ts', default: './dist/index.js' }, \
    './types': { types: './dist/types/index.d.ts', default: './dist/types/index.js' }, \
    './constants': { types: './dist/constants/index.d.ts', default: './dist/constants/index.js' }, \
    './utils': { types: './dist/utils/index.d.ts', default: './dist/utils/index.js' }, \
    './validators': { types: './dist/validators/index.d.ts', default: './dist/validators/index.js' } \
  });"

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy entrypoint script
COPY scripts/docker-entrypoint-api.sh /app/docker-entrypoint-api.sh
RUN chmod +x /app/docker-entrypoint-api.sh

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R expressjs:nodejs /app/uploads

# Ensure expressjs can write to database package (for migrations) and prisma engines
RUN chown -R expressjs:nodejs /app/packages/database
RUN chown -R expressjs:nodejs /app/node_modules/.pnpm

USER expressjs

EXPOSE 3001

ENV PORT=3001

CMD ["/app/docker-entrypoint-api.sh"]
