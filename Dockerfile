# Build stage for Distill web-app
FROM oven/bun:1 AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy the monorepo structure needed for build
COPY cursormvp/package.json cursormvp/bun.lock* ./cursormvp/
COPY cursormvp/app/packages/web-app/package.json ./cursormvp/app/packages/web-app/
COPY cursormvp/app/packages/api/package.json ./cursormvp/app/packages/api/
COPY cursormvp/app/packages/shared-types/package.json ./cursormvp/app/packages/shared-types/

# Copy Prisma schema BEFORE install (needed for postinstall script)
COPY cursormvp/app/packages/api/prisma ./cursormvp/app/packages/api/prisma

# Install dependencies (postinstall will generate Prisma client)
WORKDIR /app/cursormvp
RUN bun install --ignore-scripts
RUN bunx prisma@5.22.0 generate --schema=app/packages/api/prisma/schema.prisma

# Copy source files (API needed for type imports)
COPY cursormvp/app/packages/shared-types ./app/packages/shared-types
COPY cursormvp/app/packages/api ./app/packages/api
COPY cursormvp/app/packages/web-app ./app/packages/web-app

# Build the Next.js app (without standalone for now)
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
COPY --from=builder /app/cursormvp ./

EXPOSE 3000

# Run next start from the web-app directory
WORKDIR /app/app/packages/web-app
CMD ["bun", "run", "start"]
