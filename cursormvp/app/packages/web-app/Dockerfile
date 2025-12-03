# Build stage for Distill web-app
FROM oven/bun:1 AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy the monorepo structure needed for build (paths relative to cursormvp/)
COPY package.json bun.lock* ./
COPY app/packages/web-app/package.json ./app/packages/web-app/
COPY app/packages/api/package.json ./app/packages/api/
COPY app/packages/shared-types/package.json ./app/packages/shared-types/

# Copy Prisma schema BEFORE install (needed for postinstall script)
COPY app/packages/api/prisma ./app/packages/api/prisma

# Install dependencies (postinstall will generate Prisma client)
RUN bun install --ignore-scripts
RUN bunx prisma@5.22.0 generate --schema=app/packages/api/prisma/schema.prisma

# Copy source files (API needed for type imports)
COPY app/packages/shared-types ./app/packages/shared-types
COPY app/packages/api ./app/packages/api
COPY app/packages/web-app ./app/packages/web-app

# Build the Next.js app (without standalone - Bun node_modules incompatible)
RUN cd app/packages/web-app && bun run build

# Production stage - use Bun since it built the node_modules
FROM oven/bun:1-slim AS runner

# Install OpenSSL for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the entire workspace with node_modules and built assets
COPY --from=builder /app ./

EXPOSE 3000

# Run next start from the web-app directory
WORKDIR /app/app/packages/web-app
CMD ["bun", "run", "start"]
