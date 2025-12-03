# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy the entire monorepo structure needed for build
COPY package.json bun.lock* ./
COPY app/packages/web-app/package.json ./app/packages/web-app/
COPY app/packages/api/package.json ./app/packages/api/
COPY app/packages/shared-types/package.json ./app/packages/shared-types/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY app/packages/shared-types ./app/packages/shared-types
COPY app/packages/api/prisma ./app/packages/api/prisma
COPY app/packages/web-app ./app/packages/web-app

# Generate Prisma client
RUN cd app/packages/web-app && bunx prisma generate --schema=../api/prisma/schema.prisma

# Build the Next.js app
RUN cd app/packages/web-app && bun run build

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built assets from builder
COPY --from=builder /app/app/packages/web-app/.next/standalone ./
COPY --from=builder /app/app/packages/web-app/.next/static ./app/packages/web-app/.next/static
COPY --from=builder /app/app/packages/web-app/public ./app/packages/web-app/public

EXPOSE 3000

CMD ["bun", "app/packages/web-app/server.js"]
