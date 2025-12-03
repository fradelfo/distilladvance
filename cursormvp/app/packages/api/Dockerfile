# Build stage for Distill API
FROM oven/bun:1 AS builder

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy the monorepo structure needed for build
COPY package.json bun.lock* ./
COPY app/packages/api/package.json ./app/packages/api/
COPY app/packages/shared-types/package.json ./app/packages/shared-types/

# Copy Prisma schema BEFORE install
COPY app/packages/api/prisma ./app/packages/api/prisma

# Install dependencies (from root for workspace resolution)
RUN bun install --ignore-scripts
RUN bunx prisma@5.22.0 generate --schema=app/packages/api/prisma/schema.prisma

# Copy source files
COPY app/packages/shared-types ./app/packages/shared-types
COPY app/packages/api ./app/packages/api

# Build the API
RUN cd app/packages/api && bun run build

# Production stage
FROM oven/bun:1-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app ./

EXPOSE 3001

WORKDIR /app/app/packages/api
CMD ["bun", "run", "start"]
